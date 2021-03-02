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
    var varNamesMaskTablet = "I.BAIRRO, I.DATEX, I.ESTADO as ESTADOINC, I.TABZ, ";
    var varNamesFU = "F._savepoint_type, F.COVID, F.DATSEG, F.ESTADO, F.FU, F.LASTINTERVIEW, F.POSSIVEL, F.RAZAO, F.TESTRESUL";
    var sql = "SELECT " + varNamesMaskTablet + varNamesFU + 
        " FROM MASKTABLET AS I" + 
        " LEFT JOIN MASKFU AS F ON I.POID = F.POID" + 
        " WHERE I.BAIRRO = " + bairro +
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
            var TABZ = result.getData(row,"TABZ");

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
            
            var p = {type: 'participant', savepoint, FUDate, FUEnd, LastFU, BAIRRO, TABZ, DATEX, COVID, DATSEG, ESTADO, FU, LASTINTERVIEW, POSSIVEL, RAZAO, TESTRESUL};
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
            odkTables.launchHTML(null, 'config/assets/fuHouseGroupList.html' + queryParams);
        })        
    });
}


function getCount(tabz) {
    var today = new Date(date);
    var todayAdate = "D:" + today.getDate() + ",M:" + (Number(today.getMonth()) + 1) + ",Y:" + today.getFullYear();

    var total = participants.filter(person => person.BAIRRO == bairro & person.TABZ == tabz & ((person.FUDate <= today & person.LastFU < person.FUEnd & ((person.ESTADO != "2" & person.ESTADO != "3" & person.ESTADO != "8" & person.RAZAO != "4" & person.RAZAO != "7") | person.TESTERESUL == "3") | person.DATSEG == todayAdate))).length;
    var checked = participants.filter(person => person.BAIRRO == bairro & person.TABZ == tabz & person.DATSEG == todayAdate & person.savepoint == "COMPLETE").length;
    var count = "(" + checked + "/" + total + ")";
    return count;
}


function titleCase(str) {
    if (!str) return str;
    return str.toLowerCase().split(' ').map(function(word) {
      return (word.charAt(0).toUpperCase() + word.slice(1));
    }).join(' ');
  }