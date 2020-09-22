/**
 * Responsible for rendering the select region screen 
 */
'use strict';

var participants, masterFamList, bairro, tabz, zone, houseGroup, camo;
function display() {
    console.log("TABZ list loading");
    bairro = util.getQueryParameter('bairro');
    tabz = util.getQueryParameter('tabz');
    zone = util.getQueryParameter('zone');
    houseGroup = util.getQueryParameter('houseGroup');    
    camo = util.getQueryParameter('camo');

    var head = $('#main');
    head.prepend("<h1>" + tabz + " - " + houseGroup + " - " + camo + " </br> <h3> Família");
    
    doSanityCheck();
    getList();
}

function doSanityCheck() {
    console.log("Checking things");
    console.log(odkData);
}

// Get tabz from CSV
$.ajax({
    url: 'masterFamList.csv',
    dataType: 'text',
}).done(getMasterList);

function getMasterList(data) {
    masterFamList = [];
    var allRows = data.split(/\r?\n|\r/);
    for (var row = 1; row < allRows.length; row++) {  // start at row = 1 to skip header
            allRows[row] = allRows[row].replace(/"/g,""); // remove quotes from strings
            var rowValues = allRows[row].split(",");
            var p = {bairro: rowValues[0], tabz: rowValues[1], zone: rowValues[2], houseGroup: rowValues[3], camo: rowValues[4], fam: rowValues[5], famName: titleCase(rowValues[6]), hhoid: rowValues[7]};
            masterFamList.push(p);
    }
}

function getList() {
    // SQL to get participants
    var varNames = "_savepoint_type, CAMO, ESTADO, HHOID, HOUSEGRP, TABZ"
    var sql = "SELECT " + varNames +  
        " FROM MASKINCL " + 
        " WHERE TABZ = " + tabz + " AND HOUSEGRP = '" + houseGroup + "' AND CAMO = " + camo; 
    participants = [];
    console.log("Querying database for participants...");
    console.log(sql);
    var successFn = function( result ) {
        console.log("Found " + result.getCount() + " participants");
        for (var row = 0; row < result.getCount(); row++) {
            var savepoint = result.getData(row,"_savepoint_type");

            var CAMO = result.getData(row,"CAMO");
            var ESTADO = result.getData(row,"ESTADO");
            var HHOID = result.getData(row,"HHOID");
            var HOUSEGRP = result.getData(row,"HOUSEGRP");
            var TABZ = result.getData(row,"TABZ");

            var p = { type: 'person', savepoint, CAMO, ESTADO, HHOID, HOUSEGRP, TABZ};
            participants.push(p);
        }
        console.log("Participants:", participants)
        initButtons();
        return;
    }
    var failureFn = function( errorMsg ) {
        console.error('Failed to get participants from database: ' + errorMsg);
        console.error('Trying to execute the following SQL:');
        console.error(sql);
        alert("Program error Unable to look up persons.");
    }
    odkData.arbitraryQuery('MASKINCL', sql, null, null, null, successFn, failureFn);
}

function initButtons() {
    // Zone buttons
    var ul = $('#li');
    console.log("initB",masterFamList);

    const listFromMaster = [];
    const map = new Map();
    for (const item of masterFamList) {
        if (item.bairro == bairro & item.tabz == tabz & item.houseGroup == houseGroup & item.camo == camo) {
            if(!map.has(item.fam)){
                map.set(item.fam, true);    // set any value to Map
                listFromMaster.push({
                    bairro: item.bairro,
                    tabz: item.tabz,
                    zone: item.zone,
                    houseGroup: item.houseGroup,
                    camo: item.camo,
                    fam: item.fam,
                    famName: item.famName,
                    hhoid: item.hhoid
                });
            }
        }
    }

    $.each(listFromMaster, function() {
        // Not visited people
        const notVisitedPeople = [];
        for (const item of participants) {
        if (item.HHOID == this.hhoid) {
            notVisitedPeople.push({
                savepoint: item.savepoint
                });
            }   
        }    
        console.log("notVis",notVisitedPeople)
        // Visited people
        const visitedPeople = [];
        for (const item of participants) {
        if (item.HHOID == this.hhoid & item.savepoint == "COMPLETE" & item.ESTADO != null) {
            visitedPeople.push({
                savepoint: item.savepoint,
                ESTADO: item.ESTADO
                });
            }   
        }   
        console.log("vis",visitedPeople)
        // Check if visited     
        var visited = '';
        if (notVisitedPeople.length == visitedPeople.length) {
            visited = "visited";
        };

        var that = this;
            // list
            ul.append($("<li />").append($("<button />").attr('id',this.fam).attr('class', visited + ' btn' + this.bairro).append(this.fam + ": " + this.famName)));
        
        // Buttons
        var btn = ul.find('#' + this.fam);
        btn.on("click", function() {
            var queryParams = util.setQuerystringParams(null, that.bairro, that.tabz, that.zone, that.houseGroup, that.camo, that.fam, that.famName, that.hhoid);
            odkTables.launchHTML(null, 'config/assets/incList.html' + queryParams);
        })        
    });
}

function titleCase(str) {
    if (!str) return str;
    return str.toLowerCase().split(' ').map(function(word) {
      return (word.charAt(0).toUpperCase() + word.slice(1));
    }).join(' ');
  }