/**
 * Responsible for rendering the select region screen 
 */
'use strict';
var participants, masterFamList;
function display() {
    
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
    // SQL to get children
    var varNames = "_savepoint_type, BAIRRO, HHOID, MASC";
    var sql = "SELECT " + varNames +
        " FROM MASKINCL"
    participants = [];
    console.log("Querying database for participants...");
    console.log(sql);
    var successFn = function( result ) {
        console.log("Found " + result.getCount() + " participants");
        for (var row = 0; row < result.getCount(); row++) {
            var savepoint = result.getData(row,"_savepoint_type");

            var BAIRRO = result.getData(row,"BAIRRO");
            var HHOID = result.getData(row,"HHOID");
            var MASC = result.getData(row,"MASC");

            var p = { type: 'person', savepoint, BAIRRO, HHOID, MASC};
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
    // Bairro buttons
    var btn01 = $('#btn01');
    btn01.html("Bandim I <br />" + getCount(1));
    btn01.on("click", function() {
        var bairro = 1;
        var queryParams = util.setQuerystringParams(null, bairro);
        odkTables.launchHTML(null, 'config/assets/incTabzList.html' + queryParams);
    });
    var btn02 = $('#btn02');
    btn02.html("Bandim II <br />" + getCount(2));
    btn02.on("click", function() {
        var bairro = 2;
        var queryParams = util.setQuerystringParams(null, bairro);
        odkTables.launchHTML(null, 'config/assets/incTabzList.html' + queryParams);
    });
    var btn03 = $('#btn03');
    btn03.html("Belem <br />" + getCount(3));
    btn03.on("click", function() {
        var bairro = 3;
        var queryParams = util.setQuerystringParams(null, bairro);
        odkTables.launchHTML(null, 'config/assets/incTabzList.html' + queryParams);
    });
    var btn04 = $('#btn04');
    btn04.html("Mindara <br />" + getCount(4));
    btn04.on("click", function() {
        var bairro = 4;
        var queryParams = util.setQuerystringParams(null, bairro);
        odkTables.launchHTML(null, 'config/assets/incTabzList.html' + queryParams);
    });
    var btn05 = $('#btn05');
    btn05.html("Cuntum I <br />" + getCount(7));
    btn05.on("click", function() {
        var bairro = 7;
        var queryParams = util.setQuerystringParams(null, bairro);
        odkTables.launchHTML(null, 'config/assets/incTabzList.html' + queryParams);
    });
    var btn06 = $('#btn06');
    btn06.html("Cuntum II <br />" + getCount(9));
    btn06.on("click", function() {
        var bairro = 9;
        var queryParams = util.setQuerystringParams(null, bairro);
        odkTables.launchHTML(null, 'config/assets/incTabzList.html' + queryParams);
    });
    var count = 0;
    $.each(masterFamList, function() {
        if(this.bairro == "1") {
            count++;
        }
    });
    console.log("masterFam", masterFamList)
    console.log("test", count)
}


function getCount(bairro) {
/*const listFromMaster = [];
    const map = new Map();
    for (const item of masterFamList) {
        if (item.bairro == bairro & item.tabz == tabz & item.houseGroup == houseGroup) {
            if(!map.has(item.camo)){
                map.set(item.camo, true);    // set any value to Map
                listFromMaster.push({
                    bairro: item.bairro,
                    tabz: item.tabz,
                    zone: item.zone,
                    houseGroup: item.houseGroup,
                    camo: item.camo
                });
            }
        }
    }


    var total = participants.filter(person => person.BAIRRO == bairro & (person.FUDate <= today & ((person.ESTADO != "2" & person.ESTADO != "3") | person.CALLBACK == "1" | person.TESTERESUL == "3") | person.DATSEG == todayAdate)).length;
    var visited = participants.filter(person => person.BAIRRO == bairro & person.DATSEG == todayAdate & person.savepoint == "COMPLETE").length;
    var count = "(" + visited + "/" + total + ")";
    */return "count";
}