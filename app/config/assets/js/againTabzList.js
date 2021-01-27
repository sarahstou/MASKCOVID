/**
 * Responsible for rendering the select region screen 
 */
'use strict';

var participants, masterFamList, date, bairro, assistant;
function display() {
    console.log("TABZ list loading");
    date = util.getQueryParameter('date');
    bairro = util.getQueryParameter('bairro');
    assistant = util.getQueryParameter('assistant');

    var bairroName = {1: "Bandim I", 2: "Bandim II", 3: "Belem", 4: "Mindara", 7: "Cuntum I", 9: "Cuntum II"};
    var head = $('#main');
    head.prepend("<h1>" + bairroName[bairro] + " </br> <h3> Zonas");
    
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
            var p = {bairro: rowValues[0], tabz: rowValues[1], zone: rowValues[2], houseGroup: rowValues[3], camo: rowValues[4], fam: rowValues[5], famName: rowValues[6]};
            masterFamList.push(p);
    }
}

function getList() {
    // SQL to get participants
    var varNamesMaskTablet = "I.BAIRRO, I.TABZ, ";
    var varNamesAgain = "A._savepoint_type, A.ESTADO";
    var sql = "SELECT " + varNamesMaskTablet + varNamesAgain + 
        " FROM MASKTABLET AS I" + 
        " LEFT JOIN MASKAGAIN AS A ON I.POID = A.POID" +
        " WHERE I.BAIRRO = " + bairro +
        " ORDER BY I.FAM, I.FNO";
    participants = [];
    console.log("Querying database for participants...");
    console.log(sql);
    var successFn = function( result ) {
        console.log("Found " + result.getCount() + " participants");
        for (var row = 0; row < result.getCount(); row++) {
            var savepoint = result.getData(row,"_savepoint_type")
            
            var BAIRRO = result.getData(row,"BAIRRO");
            var TABZ = result.getData(row,"TABZ");

            var ESTADO = result.getData(row,"ESTADO");
            
            var p = {type: 'participant', savepoint, BAIRRO, TABZ, ESTADO};
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
    odkData.arbitraryQuery('MASKFU', sql, null, null, null, successFn, failureFn);
}

function initButtons() {
    // Zone buttons
    var ul = $('#li');
    console.log("initB",masterFamList);
    
    const listFromMaster = []; 
    const map = new Map();
    for (const item of masterFamList) {
        if (item.bairro == bairro) {
            if(!map.has(item.tabz)){
                map.set(item.tabz, true);    // set any value to Map
                listFromMaster.push({
                    bairro: item.bairro,
                    tabz: item.tabz,
                    zone: item.zone
                });
            }
        }
    }

    console.log("listFromMaster", listFromMaster);

    $.each(listFromMaster, function() {
        var that = this;
        // list
        ul.append($("<li />").append($("<button />").attr('id',this.tabz).attr('class','btn' + this.bairro).append(this.zone).append(" " + getCount(this.tabz))));
        
        // Buttons
        var btn = ul.find('#' + this.tabz);
        btn.on("click", function() {
            var queryParams = util.setQuerystringParams(date, that.bairro, that.tabz, that.zone, null, null, null, null, null, assistant);
            odkTables.launchHTML(null, 'config/assets/againHouseGroupList.html' + queryParams);
        })        
    });
}


function getCount(tabz) {
    var totalList = participants.filter(person => person.BAIRRO == bairro & person.TABZ == tabz);
    var total = totalList.length;
    var checked = participants.filter(person => person.BAIRRO == bairro & person.TABZ == tabz & person.ESTADO != null & person.savepoint == "COMPLETE").length;
    var count = "(" + checked + "/" + total + ")";
    return count;
}


function titleCase(str) {
    if (!str) return str;
    return str.toLowerCase().split(' ').map(function(word) {
      return (word.charAt(0).toUpperCase() + word.slice(1));
    }).join(' ');
  }