/**
 * Responsible for rendering the select region screen 
 */
'use strict';

var participants, masterFamList, date, bairro, tabz, zone, houseGroup, camo, assistant, random;
function display() {
    console.log("TABZ list loading");
    date = util.getQueryParameter('date');
    bairro = util.getQueryParameter('bairro');
    tabz = util.getQueryParameter('tabz');
    zone = util.getQueryParameter('zone');
    houseGroup = util.getQueryParameter('houseGroup');    
    camo = util.getQueryParameter('camo');
    assistant = util.getQueryParameter('assistant');

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
            var p = {bairro: rowValues[0], tabz: rowValues[1], zone: rowValues[2], houseGroup: rowValues[3], camo: rowValues[4], fam: rowValues[5], famName: titleCase(rowValues[6])};
            masterFamList.push(p);
    }
}

function getList() {
    // SQL to get participants
    var varNamesIncl = "I.BAIRRO, I.CAMO, I.FAM, I.HOUSEGRP, I.TABZ, ";
    var varNamesHH = "H.DATEX, H.RANGROUP, ";
    var varNamesFU = "F._savepoint_type, F.COVID, F.DATSEG, F.ESTADO, F.FU, F.LASTINTERVIEW, F.POSSIVEL, F.TESTRESUL";
    var sql = "SELECT " + varNamesIncl + varNamesHH + varNamesFU + 
        " FROM MASKINCL AS I" + 
        " LEFT JOIN MASKFU AS F ON I.POID = F.POID" + 
        " INNER JOIN MASKHOUSEHOLD AS H ON I.HHOID = H.HHOID" +
        " WHERE I.BAIRRO = " + bairro + " AND I.TABZ = " + tabz + " AND I.HOUSEGRP = '" + houseGroup + "' AND I.CAMO = " + camo + " AND I.OBS_IDADE IS NULL AND (I.ACCEPT != 2 OR I.ACCEPT IS NULL) AND I.ESTADO IS NOT NULL" +
        " GROUP BY I.POID HAVING MAX(F.FU) OR F.FU IS NULL" +
        " ORDER BY I.FAM";
    participants = [];
    console.log("Querying database for participants...");
    console.log(sql);
    var successFn = function( result ) {
        console.log("Found " + result.getCount() + " participants");
        for (var row = 0; row < result.getCount(); row++) {
            var savepoint = result.getData(row,"_savepoint_type")
            
            var BAIRRO = result.getData(row,"BAIRRO");
            var CAMO = result.getData(row,"CAMO");
            var FAM = result.getData(row,"FAM");
            var HOUSEGRP = result.getData(row,"HOUSEGRP");
            var TABZ = result.getData(row,"TABZ");

            var DATEX = result.getData(row,"DATEX");
            var RANGROUP = result.getData(row,"RANGROUP")

            var COVID = result.getData(row,"COVID");
            var DATSEG = result.getData(row,"DATSEG");
            var ESTADO = result.getData(row,"ESTADO");
            var FU = result.getData(row,"FU");
            var LASTINTERVIEW = result.getData(row,"LASTINTERVIEW");
            var POSSIVEL = result.getData(row,"POSSIVEL");
            var TESTRESUL = result.getData(row,"TESTRESUL");
            
            // generate follow-up date (42 days after last interview with succes follow up)
            if (FU != null & (COVID == null | POSSIVEL == "2" | TESTRESUL == "3")) {
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
            
            // get group
            random = RANGROUP;

            var p = {type: 'participant', savepoint, FUDate, FUEnd, LastFU, BAIRRO, CAMO, FAM, HOUSEGRP, TABZ, DATEX, RANGROUP, COVID, DATSEG, ESTADO, FU, LASTINTERVIEW, POSSIVEL, TESTRESUL};
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
                    famName: item.famName
                });
            }
        }
    }

    $.each(listFromMaster, function() {
        var that = this;
            // list
            ul.append($("<li />").append($("<button />").attr('id',this.fam).attr('class','btn' + this.bairro).append(this.fam + ": " + this.famName).append(" " + getCount(this.fam))));
        
        // Buttons
        var btn = ul.find('#' + this.fam);
        btn.on("click", function() {
            var queryParams = util.setQuerystringParams(date, that.bairro, that.tabz, that.zone, that.houseGroup, that.camo, that.fam, that.famName, null, assistant, random);
            odkTables.launchHTML(null, 'config/assets/fuList.html' + queryParams);
        })        
    });
}

function getCount(fam) {
    var today = new Date(date);
    var todayAdate = "D:" + today.getDate() + ",M:" + (Number(today.getMonth()) + 1) + ",Y:" + today.getFullYear();

    var total = participants.filter(person => person.BAIRRO == bairro & person.TABZ == tabz & person.HOUSEGRP == houseGroup & person.CAMO == camo & person.FAM == fam & (person.FUDate <= today & person.LastFU < person.FUEnd & ((person.ESTADO != "2" & person.ESTADO != "3") | person.POSSIVEL == "2" | person.TESTERESUL == "3") | person.DATSEG == todayAdate)).length;
    var checked = participants.filter(person => person.BAIRRO == bairro & person.TABZ == tabz & person.HOUSEGRP == houseGroup & person.CAMO == camo & person.FAM == fam & person.DATSEG == todayAdate & person.savepoint == "COMPLETE").length;
    var count = "(" + checked + "/" + total + ")";
    return count;
}

function titleCase(str) {
    if (!str) return str;
    return str.toLowerCase().split(' ').map(function(word) {
      return (word.charAt(0).toUpperCase() + word.slice(1));
    }).join(' ');
  }