/**
 * Responsible for rendering the select region screen 
 */
'use strict';

var participants, masterFamList, date, bairro, tabz, zone;
function display() {
    console.log("TABZ list loading");
    date = util.getQueryParameter('date');
    bairro = util.getQueryParameter('bairro');
    tabz = util.getQueryParameter('tabz');
    zone = util.getQueryParameter('zone');
    
    var head = $('#main');
    head.prepend("<h1>" + tabz + " </br> <h3> Grupos de Casas");
    
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
    var sql = "SELECT _savepoint_type " + 
        " FROM MASKCOVID "; 
    participants = [];
    console.log("Querying database for participants...");
    console.log(sql);
    var successFn = function( result ) {
        console.log("Found " + result.getCount() + " participants");
        for (var row = 0; row < result.getCount(); row++) {
            var savepoint = result.getData(row,"_savepoint_type");

            var BAIRRO = result.getData(row,"BAIRRO");
            var CALLBACK = result.getData(row,"CALLBACK");
            var COVID = result.getData(row,"COVID");
            var DATINC = result.getData(row,"DATINC");
            var DATSEG = result.getData(row,"DATSEG");
            var ESTADO = result.getData(row,"ESTADO");
            var FU = result.getData(row,"FU");
            var LASTINTERVIEW = result.getData(row,"LASTINTERVIEW");
            var POID = result.getData(row,"POID");
            var TABZ = result.getData(row,"TABZ");
            var TESTERESUL = result.getData(row,"TESTERESUL");

            // generate follow-up date (28 days after last interview with succes follow up)
            if (FU == 1 & (COVID == null | CALLBACK == "1" | TESTERESUL == "3")) {
                var incD = Number(DATINC.slice(2, DATINC.search("M")-1));
                var incM = DATINC.slice(DATINC.search("M")+2, DATINC.search("Y")-1);
                var incY = DATINC.slice(DATINC.search("Y")+2);
                var FUDate = new Date(incY, incM-1, incD + 28);
            } else if (COVID == null | CALLBACK == "1" | TESTERESUL == "3") {
                var segD = Number(DATSEG.slice(2, DATSEG.search("M")-1));
                var segM = DATSEG.slice(DATSEG.search("M")+2, DATSEG.search("Y")-1);
                var segY = DATSEG.slice(DATSEG.search("Y")+2);
                var FUDate = new Date(segY, segM-1, segD);
            } else {
                var segD = Number(DATSEG.slice(2, DATSEG.search("M")-1));
                var segM = DATSEG.slice(DATSEG.search("M")+2, DATSEG.search("Y")-1);
                var segY = DATSEG.slice(DATSEG.search("Y")+2);
                var FUDate = new Date(segY, segM-1, segD + 28);
            }   

            var p = { type: 'person', savepoint, BAIRRO, CALLBACK, COVID, DATINC, DATSEG, ESTADO, FU, FUDate, LASTINTERVIEW, POID, TABZ, TESTERESUL};
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
    odkData.arbitraryQuery('MASKCOVID', sql, null, null, null, successFn, failureFn);
}

function initButtons() {
    // Zone buttons
    var ul = $('#li');
    console.log("initB",masterFamList);

    const listFromMaster = [];
    const map = new Map();
    for (const item of masterFamList) {
        if (item.bairro == bairro & item.tabz == tabz) {
            if(!map.has(item.houseGroup)){
                map.set(item.houseGroup, true);    // set any value to Map
                listFromMaster.push({
                    bairro: item.bairro,
                    tabz: item.tabz,
                    zone: item.zone,
                    houseGroup: item.houseGroup
                });
            }
        }
    }

    console.log("listFromMaster", listFromMaster);

    $.each(listFromMaster, function() {
        var that = this;
        // list
        ul.append($("<li />").append($("<button />").attr('id',this.houseGroup).attr('class','btn' + this.bairro).append(this.houseGroup).append(" " + getCount(this.houseGroup))));
        
        // Buttons
        var btn = ul.find('#' + this.houseGroup);
        btn.on("click", function() {
            var queryParams = util.setQuerystringParams(date, that.bairro, that.tabz, that.zone, that.houseGroup);
            odkTables.launchHTML(null, 'config/assets/incCamoList.html' + queryParams);
        })        
    });
}


function getCount(houseGroup) { 
    // only for test
    return "(X/X)"
}


/* disabled while testing
function getCount(tabz) {
    var today = new Date(date);
    var todayAdate = "D:" + today.getDate() + ",M:" + (Number(today.getMonth()) + 1) + ",Y:" + today.getFullYear();

    var total = participants.filter(person => person.BAIRRO == bairro & person.TABZ == tabz & (person.FUDate <= today & ((person.ESTADO != "2" & person.ESTADO != "3") | person.CALLBACK == "1" | person.TESTERESUL == "3") | person.DATSEG == todayAdate)).length;
    var checked = participants.filter(person => person.BAIRRO == bairro & person.TABZ == tabz & person.DATSEG == todayAdate & person.savepoint == "COMPLETE").length;
    var count = "(" + checked + "/" + total + ")";
    return count;
}
*/

function titleCase(str) {
    if (!str) return str;
    return str.toLowerCase().split(' ').map(function(word) {
      return (word.charAt(0).toUpperCase() + word.slice(1));
    }).join(' ');
  }