/**
 * Responsible for rendering the select region screen 
 */
'use strict';
var participants, selDay, selMon, selYea, date;
function display() {
    selDay = $('#selDateDay');
    selMon = $('#selDateMonth');
    selYea = $('#selDateYear');
    
    doSanityCheck();
    initDate();
}


function doSanityCheck() {
    console.log("Checking things");
    console.log(odkData);
}

function getList() {
    // SQL to get children
    var sql = "SELECT _savepoint_type, BAIRRO, CALLBACK, COVID, DATINC, DATSEG, ESTADO, FU, LASTINTERVIEW, POID, TESTERESUL " + 
        " FROM MASKCOVID " +
        " GROUP BY POID HAVING MAX(FU)"; 
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

            var p = { type: 'person', savepoint, BAIRRO, CALLBACK, COVID, DATINC, DATSEG, ESTADO, FU, FUDate, LASTINTERVIEW, POID, TESTERESUL};
            participants.push(p);
        }
        console.log("Participants:", participants)
        initDate();
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

function initDate() {
    // Date dropdown
    // Set default date
    var today = new Date();
    var defaultDay = today.getDate();
    var defaultMon = today.getMonth()+1;
    var defaultYea = today.getFullYear();

    // List of date, months, years
    var days = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31];
    var months = [1,2,3,4,5,6,7,8,9,10,11,12];
    var years = [defaultYea-1, defaultYea, defaultYea+1];

    $.each(days, function() {
        if (this == defaultDay) {
            selDay.append($("<option />").val(this).text(this).attr("selected",true));
        } else {
            selDay.append($("<option />").val(this).text(this));
        }
    })

    $.each(months, function() {
        if (this == defaultMon) {
            selMon.append($("<option />").val(this).text(this).attr("selected",true));
        } else {
            selMon.append($("<option />").val(this).text(this));
        }
    })

    $.each(years, function() {
        if (this == defaultYea) {
            selYea.append($("<option />").val(this).text(this).attr("selected",true));
        } else {
            selYea.append($("<option />").val(this).text(this));
        }
    })
    document.getElementById("selDateDay").onchange = function() {initButtons()};
    document.getElementById("selDateMonth").onchange = function() {initButtons()};
    document.getElementById("selDateYear").onchange = function() {initButtons()};
    initButtons();
}

function initButtons() {
    // Bairro buttons
    var btn01 = $('#btn01');
    btn01.html("Bandim I <br />" + getCount(1));
    btn01.on("click", function() {
        var bairro = 1;
        var date = new Date(selYea.val(), selMon.val()-1, selDay.val());
        var queryParams = util.setQuerystringParams(date, bairro);
        odkTables.launchHTML(null, 'config/assets/incTabzList.html' + queryParams);
    });
    var btn02 = $('#btn02');
    btn02.html("Bandim II <br />" + getCount(2));
    btn02.on("click", function() {
        var bairro = 2;
        var date = new Date(selYea.val(), selMon.val()-1, selDay.val());
        var queryParams = util.setQuerystringParams(date, bairro);
        odkTables.launchHTML(null, 'config/assets/incTabzList.html' + queryParams);
    });
    var btn03 = $('#btn03');
    btn03.html("Belem <br />" + getCount(3));
    btn03.on("click", function() {
        var bairro = 3;
        var date = new Date(selYea.val(), selMon.val()-1, selDay.val());
        var queryParams = util.setQuerystringParams(date, bairro);
        odkTables.launchHTML(null, 'config/assets/incTabzList.html' + queryParams);
    });
    var btn04 = $('#btn04');
    btn04.html("Mindara <br />" + getCount(4));
    btn04.on("click", function() {
        var bairro = 4;
        var date = new Date(selYea.val(), selMon.val()-1, selDay.val());
        var queryParams = util.setQuerystringParams(date, bairro);
        odkTables.launchHTML(null, 'config/assets/incTabzList.html' + queryParams);
    });
    var btn05 = $('#btn05');
    btn05.html("Cuntum I <br />" + getCount(7));
    btn05.on("click", function() {
        var bairro = 7;
        var date = new Date(selYea.val(), selMon.val()-1, selDay.val());
        var queryParams = util.setQuerystringParams(date, bairro);
        odkTables.launchHTML(null, 'config/assets/incTabzList.html' + queryParams);
    });
    var btn06 = $('#btn06');
    btn06.html("Cuntum II <br />" + getCount(9));
    btn06.on("click", function() {
        var bairro = 9;
        var date = new Date(selYea.val(), selMon.val()-1, selDay.val());
        var queryParams = util.setQuerystringParams(date, bairro);
        odkTables.launchHTML(null, 'config/assets/incTabzList.html' + queryParams);
    });
}

function getCount(bairro) { 
    // only for test
    return "(X/X)"
}


/* disabled while testing
function getCount(bairro) {
    var today = new Date(selYea.val(), selMon.val()-1, selDay.val());
    var todayAdate = "D:" + today.getDate() + ",M:" + (Number(today.getMonth()) + 1) + ",Y:" + today.getFullYear();

    var total = participants.filter(person => person.BAIRRO == bairro & (person.FUDate <= today & ((person.ESTADO != "2" & person.ESTADO != "3") | person.CALLBACK == "1" | person.TESTERESUL == "3") | person.DATSEG == todayAdate)).length;
    var checked = participants.filter(person => person.BAIRRO == bairro & person.DATSEG == todayAdate & person.savepoint == "COMPLETE").length;
    var count = "(" + checked + "/" + total + ")";
    return count;
}
*/
