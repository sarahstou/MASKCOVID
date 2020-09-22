/**
 * Responsible for rendering the select region screen 
 */
'use strict';
var households, masterFamList;
function display() {
    
    doSanityCheck();
    getList();
}

function doSanityCheck() {
    console.log("Checking things");
    console.log(odkData);
}

function getList() {
    // SQL to get households
    var varNames = "_savepoint_type, BAIRRO, VISITA";
    var sql = "SELECT " + varNames +
        " FROM MASKHOUSEHOLD"
    households = [];
    console.log("Querying database for households...");
    console.log(sql);
    var successFn = function( result ) {
        console.log("Found " + result.getCount() + " households");
        for (var row = 0; row < result.getCount(); row++) {
            var savepoint = result.getData(row,"_savepoint_type");

            var BAIRRO = result.getData(row,"BAIRRO");
            var VISITA = result.getData(row,"VISITA")

            var p = { type: 'household', savepoint, BAIRRO, VISITA};
            households.push(p);
        }
        console.log("households:", households)
        initButtons();
        return;
    }
    var failureFn = function( errorMsg ) {
        console.error('Failed to get households from database: ' + errorMsg);
        console.error('Trying to execute the following SQL:');
        console.error(sql);
        alert("Program error Unable to look up persons.");
    }
    odkData.arbitraryQuery('MASKHOUSEHOLD', sql, null, null, null, successFn, failureFn);
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
}


function getCount(bairro) {
    var total = households.filter(household => household.BAIRRO == bairro).length;
    var visited = households.filter(household => household.BAIRRO == bairro & household.VISITA != null & household.savepoint == "COMPLETE").length;
    var count = "(" + visited + "/" + total + ")";
    return count;
}