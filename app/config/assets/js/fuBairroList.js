/**
 * Responsible for rendering the select region screen 
 */
'use strict';
var assistants, participants, selDay, selMon, selYea, selAssistant, date;
function display() {
    selDay = $('#selDateDay');
    selMon = $('#selDateMonth');
    selYea = $('#selDateYear');
    selAssistant = $('#selAssistant');
    
    doSanityCheck();
    getList();
}

function doSanityCheck() {
    console.log("Checking things");
    console.log(odkData);
}

// Get assistants from CSV
$.ajax({
    url: 'assistants.csv',
    dataType: 'text',
}).done(getAssistants);

function getAssistants(data) {
    assistants = [];
    var allRows = data.split(/\r?\n|\r/);
    for (var row = 1; row < allRows.length; row++) {  // start at row = 1 to skip header
        var rowValues = allRows[row].split(",");
        var p = {code: rowValues[0], name: rowValues[1]};
        assistants.push(p);
    }
    console.log('Assistants', assistants);
}

function getList() {
    // SQL to get persons
    var varNamesMaskTablet = "I.BAIRRO, I.DATEX, I.ESTADO as ESTADOINC, ";
    var varNamesFU = "F._savepoint_type, F.COVID, F.DATSEG, F.ESTADO, F.FU, F.LASTINTERVIEW, F.POSSIVEL, F.RAZAO, F.TESTRESUL";
    var sql = "SELECT " + varNamesMaskTablet + varNamesFU + 
        " FROM MASKTABLET AS I" + 
        " LEFT JOIN MASKFU AS F ON I.POID = F.POID" +
        " GROUP BY I.POID HAVING MAX(F.FU) OR F.FU IS NULL" +
        " ORDER BY I.FNO";
    participants = [];
    console.log("Querying database for participants...");
    console.log(sql);
    var successFn = function( result ) {
        console.log("Found " + result.getCount() + " participants");
        for (var row = 0; row < result.getCount(); row++) {
            var savepoint = result.getData(row,"_savepoint_type")
            
            var BAIRRO = result.getData(row,"BAIRRO");
            var DATEX = result.getData(row,"DATEX");
            var ESTADOINC = result.getData(row,"ESTADOINC");

            var COVID = result.getData(row,"COVID");
            var DATSEG = result.getData(row,"DATSEG");
            var ESTADO = result.getData(row,"ESTADO");
            var FU = result.getData(row,"FU");
            var LASTINTERVIEW = result.getData(row,"LASTINTERVIEW");
            var POSSIVEL = result.getData(row,"POSSIVEL");
            var RAZAO = result.getData(row,"RAZAO");
            var TESTRESUL = result.getData(row,"TESTRESUL");

            // ESTADO varialbe check
            if (ESTADO == null) {
                ESTADO = ESTADOINC
            };
            
            // generate follow-up date (42 days after last interview with succes follow up)
            if (FU != null & (COVID == null & FU - Math.floor(FU) < 0.02 | TESTRESUL == "3")) {
                var segD = Number(DATSEG.slice(2, DATSEG.search("M")-1));
                var segM = DATSEG.slice(DATSEG.search("M")+2, DATSEG.search("Y")-1);
                var segY = DATSEG.slice(DATSEG.search("Y")+2);
                var FUDate = new Date(segY, segM-1, segD);
                // set last succes follow up to last interview
                var intD = Number(LASTINTERVIEW.slice(2, LASTINTERVIEW.search("M")-1));
                var intM = LASTINTERVIEW.slice(LASTINTERVIEW.search("M")+2, LASTINTERVIEW.search("Y")-1);
                var intY = LASTINTERVIEW.slice(LASTINTERVIEW.search("Y")+2);
                var LastFU = new Date(intY, intM-1, intD);
            } else if (DATEX == null) {
                var FUDate = new Date(2099, 7-1, 15);
                var LastFU = new Date(2099, 7-1, 15);
            } else if (FU == null) {
                var datexD = Number(DATEX.slice(2, DATEX.search("M")-1));
                var datexM = DATEX.slice(DATEX.search("M")+2, DATEX.search("Y")-1);
                var datexY = DATEX.slice(DATEX.search("Y")+2);
                var FUDate = new Date(datexY, datexM-1, datexD + 42);
                var LastFU = new Date(datexY, datexM-1, datexD);
            } else if (FU - Math.floor(FU) > 0.02) { // if tried call 3 times: set FU date to +42 days
                var segD = Number(DATSEG.slice(2, DATSEG.search("M")-1));
                var segM = DATSEG.slice(DATSEG.search("M")+2, DATSEG.search("Y")-1);
                var segY = DATSEG.slice(DATSEG.search("Y")+2);
                var FUDate = new Date(segY, segM-1, segD + 42);
                var LastFU = new Date(segY, segM-1, segD);
            } else {
                var segD = Number(DATSEG.slice(2, DATSEG.search("M")-1));
                var segM = DATSEG.slice(DATSEG.search("M")+2, DATSEG.search("Y")-1);
                var segY = DATSEG.slice(DATSEG.search("Y")+2);
                var FUDate = new Date(segY, segM-1, segD + 42);
                var LastFU = new Date(segY, segM-1, segD);
            }
            // Set 4 month date for ending FU
            if (DATEX == null) {
                var FUEnd = new Date(2099, 7-1, 15 + 122);
            } else {
                var datexD = Number(DATEX.slice(2, DATEX.search("M")-1));
                var datexM = DATEX.slice(DATEX.search("M")+2, DATEX.search("Y")-1);
                var datexY = DATEX.slice(DATEX.search("Y")+2);
                var FUEnd = new Date(datexY, datexM-1, datexD + 122);
            }
            
            var p = {type: 'participant', savepoint, FUDate, FUEnd, LastFU, BAIRRO, DATEX, COVID, DATSEG, ESTADO, FU, LASTINTERVIEW, POSSIVEL, RAZAO, TESTRESUL};
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
    odkData.arbitraryQuery('MASKFU', sql, null, null, null, successFn, failureFn);
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
    
    // Assistants dropdown
    selAssistant.append($("<option />").val(-1).text("Assistente"));
    $.each(assistants, function() {
        selAssistant.append($("<option />").val(this.code).text(this.name));
    })
    
    document.getElementById("selDateDay").onchange = function() {initButtons()};
    document.getElementById("selDateMonth").onchange = function() {initButtons()};
    document.getElementById("selDateYear").onchange = function() {initButtons()};
    document.getElementById("selAssistant").onchange = function() {initButtons()};
    
    initButtons();
}


function initButtons() {
    // Bairro buttons
    var assistant = selAssistant.val();
    console.log("assbtn", assistant)
    var btn01 = $('#btn01');
    btn01.html("Bandim I <br />" + getCount(1));
    btn01.on("click", function() {
        if (!assistant || assistant < 0 ) {
            selAssistant.css('background-color','pink');
            return false;
        }
        var bairro = 1;
        var date = new Date(selYea.val(), selMon.val()-1, selDay.val());
        var queryParams = util.setQuerystringParams(date, bairro, null, null, null, null, null, null, null, assistant);
        odkTables.launchHTML(null, 'config/assets/fuTabzList.html' + queryParams);
    });
    var btn02 = $('#btn02');
    btn02.html("Bandim II <br />" + getCount(2));
    btn02.on("click", function() {
        if (!assistant || assistant < 0 ) {
            selAssistant.css('background-color','pink');
            return false;
        }
        var bairro = 2;
        var date = new Date(selYea.val(), selMon.val()-1, selDay.val());
        var queryParams = util.setQuerystringParams(date, bairro, null, null, null, null, null, null, null, assistant);
        odkTables.launchHTML(null, 'config/assets/fuTabzList.html' + queryParams);
    });
    var btn03 = $('#btn03');
    btn03.html("Belem <br />" + getCount(3));
    btn03.on("click", function() {
        if (!assistant || assistant < 0 ) {
            selAssistant.css('background-color','pink');
            return false;
        }
        var bairro = 3;
        var date = new Date(selYea.val(), selMon.val()-1, selDay.val());
        var queryParams = util.setQuerystringParams(date, bairro, null, null, null, null, null, null, null, assistant);
        odkTables.launchHTML(null, 'config/assets/fuTabzList.html' + queryParams);
    });
    var btn04 = $('#btn04');
    btn04.html("Mindara <br />" + getCount(4));
    btn04.on("click", function() {
        if (!assistant || assistant < 0 ) {
            selAssistant.css('background-color','pink');
            return false;
        }
        var bairro = 4;
        var date = new Date(selYea.val(), selMon.val()-1, selDay.val());
        var queryParams = util.setQuerystringParams(date, bairro, null, null, null, null, null, null, null, assistant);
        odkTables.launchHTML(null, 'config/assets/fuTabzList.html' + queryParams);
    });
    var btn05 = $('#btn05');
    btn05.html("Cuntum I <br />" + getCount(7));
    btn05.on("click", function() {
        if (!assistant || assistant < 0 ) {
            selAssistant.css('background-color','pink');
            return false;
        }
        var bairro = 7;
        var date = new Date(selYea.val(), selMon.val()-1, selDay.val());
        var queryParams = util.setQuerystringParams(date, bairro, null, null, null, null, null, null, null, assistant);
        odkTables.launchHTML(null, 'config/assets/fuTabzList.html' + queryParams);
    });
    var btn06 = $('#btn06');
    btn06.html("Cuntum II <br />" + getCount(9));
    btn06.on("click", function() {
        if (!assistant || assistant < 0 ) {
            selAssistant.css('background-color','pink');
            return false;
        }
        var bairro = 9;
        var date = new Date(selYea.val(), selMon.val()-1, selDay.val());
        var queryParams = util.setQuerystringParams(date, bairro, null, null, null, null, null, null, null, assistant);
        odkTables.launchHTML(null, 'config/assets/fuTabzList.html' + queryParams);
    });
}

function getCount(bairro) {
    var today = new Date(selYea.val(), selMon.val()-1, selDay.val());
    var todayAdate = "D:" + today.getDate() + ",M:" + (Number(today.getMonth()) + 1) + ",Y:" + today.getFullYear();

    var total = participants.filter(person => person.BAIRRO == bairro & ((person.FUDate <= today & person.LastFU < person.FUEnd & ((person.ESTADO != "2" & person.ESTADO != "3" & person.ESTADO != "8" & person.RAZAO != "4" & person.RAZAO != "7") | person.TESTERESUL == "3")| person.DATSEG == todayAdate))).length;
    var checked = participants.filter(person => person.BAIRRO == bairro & person.DATSEG == todayAdate & person.savepoint == "COMPLETE").length;
    var count = "(" + checked + "/" + total + ")";
    return count;
}
