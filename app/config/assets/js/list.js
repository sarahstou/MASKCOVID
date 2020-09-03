/**
 * Responsible for rendering persons to look up
 */
'use strict';

var participants, date, bairro, tabz, zone, houseGroup, camo, fam, famName;
function display() {
    console.log("TABZ list loading");
    date = util.getQueryParameter('date');
    bairro = util.getQueryParameter('bairro');
    tabz = util.getQueryParameter('tabz');
    zone = util.getQueryParameter('zone');
    houseGroup = util.getQueryParameter('houseGroup');
    camo = util.getQueryParameter('camo');
    fam = util.getQueryParameter('fam');
    famName = util.getQueryParameter('famName');
    
    var head = $('#main');
    head.prepend("<h1>" + tabz + " - " + houseGroup + " - " + camo + " </br> <h3> " + famName);
    // populate list
    loadPersons();
}

function loadPersons() {
    // SQL to get persons
    var varNames = "_id, _savepoint_type, BAIRRO, CALLBACK, CAMO, COVID, DATINC, DATSEG, DOB, ESTADO, FU, GETRESULTS, LASTINTERVIEW, LASTTELSUC, NOME, NUMEST, POID, SEX, TABZ, TELE, TELMTN1, TELMTN2, TELMTN3, TELORA1, TELORA2, TELORA3, TELOU1, TELOU2, TELSUC, TESTERESUL";
    var sql = "SELECT " + varNames +
        " FROM MASKCOVID" + 
        " WHERE BAIRRO = " + bairro + " AND TABZ = " + tabz + 
        " GROUP BY POID HAVING MAX(FU)" +
        " ORDER BY CAMO, POID";
        participants = [];
    console.log("Querying database for participants...");
    console.log(sql);
    var successFn = function( result ) {
        console.log("Found " + result.getCount() + " participants");
        for (var row = 0; row < result.getCount(); row++) {
            var rowId = result.getData(row,"_id"); // row ID 
            var savepoint = result.getData(row,"_savepoint_type")

            var BAIRRO = result.getData(row,"BAIRRO");
            var CALLBACK = result.getData(row,"CALLBACK");
            var CAMO = result.getData(row,"CAMO");
            var COVID = result.getData(row,"COVID");
            var DATINC = result.getData(row,"DATINC");
            var DATSEG = result.getData(row,"DATSEG");
            var DOB = result.getData(row,"DOB");
            var ESTADO = result.getData(row,"ESTADO");
            var FU = result.getData(row,"FU");
            var GETRESULTS = result.getData(row,"GETRESULTS");
            var LASTINTERVIEW = result.getData(row,"LASTINTERVIEW");
            var LASTTELSUC = result.getData(row,"LASTTELSUC");
            var NOME = titleCase(result.getData(row,"NOME"));
            var NUMEST = result.getData(row,"NUMEST");
            var POID = result.getData(row,"POID");
            var SEX = result.getData(row,"SEX");
            var TABZ = result.getData(row,"TABZ");
            var TELE = result.getData(row,"TELE");
            var TELMTN1 = result.getData(row,"TELMTN1");
            var TELMTN2 = result.getData(row,"TELMTN2");
            var TELMTN3 = result.getData(row,"TELMTN3");
            var TELORA1 = result.getData(row,"TELORA1");
            var TELORA2 = result.getData(row,"TELORA2");
            var TELORA3 = result.getData(row,"TELORA3");
            var TELOU1 = result.getData(row,"TELOU1");
            var TELOU2 = result.getData(row,"TELOU2");
            var TELSUC = result.getData(row,"TELSUC");
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

            var p = {type: 'participant', rowId, savepoint, BAIRRO, CALLBACK, CAMO, COVID, DATINC, DATSEG, DOB, ESTADO, FU, FUDate, GETRESULTS, LASTINTERVIEW, LASTTELSUC, NOME, NUMEST, POID, SEX, TABZ, TELE, TELMTN1, TELMTN2, TELMTN3, TELORA1, TELORA2, TELORA3, TELOU1, TELOU2, TELSUC, TESTERESUL};
            participants.push(p);
        }
        console.log("Participants:", participants)
        populateView();
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

function populateView() {
    var today = new Date(date);
    var todayAdate = "D:" + today.getDate() + ",M:" + (Number(today.getMonth()) + 1) + ",Y:" + today.getFullYear();
    console.log("today", today);
    console.log("todayAdate", todayAdate);
    
    var ul = $('#li');

    // list
    $.each(participants, function() {
        var that = this;  
        
        // Check if called today
        var called = '';
        if (this.DATSEG == todayAdate & this.savepoint == "COMPLETE") {
            called = "called";
        };

        // check if we only call for test result to change color
        var getResults = "";
        if (this.TESTERESUL == "3" & this.CALLBACK != "1" & called != "called" | this.GETRESULTS == "1") {
            getResults = "getResults";
        };
        
        // set text to display
        var displayText = setDisplayText(that);
        
        // list
        if (this.FUDate <= today & ((this.ESTADO != "2" & this.ESTADO != "3") | this.CALLBACK == "1" | this.TESTERESUL == "3") | this.DATSEG == todayAdate) {
            ul.append($("<li />").append($("<button />").attr('id',this.POID).attr('class', called + ' btn ' + this.type + getResults).append(displayText)));
        }
        
        // Buttons
        var btn = ul.find('#' + this.POID);
        btn.on("click", function() {
            openForm(that);
        })        
    });
}


function setDisplayText(person) {
    var dob;
    if (person.DOB == "D:NS,M:NS,Y:NS" | person.DOB === null) {
        dob = "Não Sabe";
    } else {
        dob = formatDate(person.DOB);
    }

    var datinc;
    if (person.DATINC == "D:NS,M:NS,Y:NS" | person.DATINC === null) {
        datinc = "Não Sabe";
    } else {
        datinc = formatDate(person.DATINC);
    }

    var sex;
    if (person.SEX == 1) {
        sex = "Masculino"
    } else {
        sex = "Feminino"
    }

    var displayText = "Nome: " + person.NOME + "<br />" + 
        "Sexo: " + sex + "<br />" +
        "Nacimento: " + dob + "<br />" +
        "Tabz: " + person.TABZ + "; Camo: " + person.CAMO + "<br />" +
        "Inclusão: " + datinc;
    return displayText
}

function formatDate(adate) {
    var d = adate.slice(2, adate.search("M")-1);
    var m = adate.slice(adate.search("M")+2, adate.search("Y")-1);
    var y = adate.slice(adate.search("Y")+2);
    var date = d + "/" + m + "/" + y;
    return date;
}

function openForm(person) {
    console.log("Preparing form for: ", person);

    var today = new Date(date);
    var todayAdate = "D:" + today.getDate() + ",M:" + (Number(today.getMonth()) + 1) + ",Y:" + today.getFullYear();

    var rowId = person.rowId;
    var tableId = 'OPVCOVID';
    var formId = 'OPVCOVID';
    
    if ((person.FU == 1 & person.DATSEG == null) | person.DATSEG == todayAdate) {
        odkTables.editRowWithSurvey(
            null,
            tableId,
            rowId,
            formId,
            null,);
        }
    else {
        var defaults = getDefaults(person);
        // if we need test results and callback do total interview, else only test results
        if (person.TESTERESUL == "3" & person.CALLBACK != "1") {
            defaults["GETRESULTS"] = 1;
            defaults["ESTADO"] = person.ESTADO;
        }
        console.log("Opening form with: ", defaults); 
        odkTables.addRowWithSurvey(
            null,
            tableId,
            formId,
            null,
            defaults);
    }
}

function toAdate(date) {
    var jsDate = new Date(date);
    return "D:" + jsDate.getDate() + ",M:" + (Number(jsDate.getMonth()) + 1) + ",Y:" + jsDate.getFullYear();
}

function getDefaults(person) {
    var defaults = {};
    defaults['BAIRRO'] = person.BAIRRO;
    defaults['CAMO'] = person.CAMO;
    defaults['DATINC'] = person.DATINC;
    defaults['DATSEG'] = toAdate(date);
    defaults['DOB'] = person.DOB;
    defaults['FU'] = getFU(person);
    defaults['LASTINTERVIEW'] = getLastInterview(person);
    defaults['LASTTELSUC'] = getLastTelSuc(person);
    defaults['NOME'] = person.NOME;
    defaults['NUMEST'] = person.NUMEST;
    defaults['POID'] = person.POID;
    defaults['SEX'] = person.SEX;
    defaults['TABZ'] = person.TABZ;
    defaults['TELE'] = person.TELE;
    defaults['TELMTN1'] = person.TELMTN1;
    defaults['TELMTN2'] = person.TELMTN2;
    defaults['TELMTN3'] = person.TELMTN3;
    defaults['TELORA1'] = person.TELORA1;
    defaults['TELORA2'] = person.TELORA2;
    defaults['TELORA3'] = person.TELORA3;
    defaults['TELOU1'] = person.TELOU1;
    defaults['TELOU2'] = person.TELOU2;

    return defaults;
}

function getFU(person) {
    var FU;
    if (person.COVID != null & person.CALLBACK != "1" & person.TESTERESUL != "3")  {
        FU = floor(person.FU) + 1;
    } else {
        FU = person.FU + 0.01;
    }
    return FU;
} 

function getLastInterview(person) {
    var lastInterview;
    if (person.COVID != null & person.CALLBACK != "1" & person.TESTERESUL != "3")  {
        lastInterview = person.DATSEG;
    } else {
        lastInterview = person.LASTINTERVIEW;
    }
    return lastInterview;
}

function getLastTelSuc(person) {
    var lastTelSuc;
    if (person.COVID != null & person.CALLBACK != "1")  {
        lastTelSuc = person.TELSUC;
    } else {
        lastTelSuc = person.LASTTELSUC;
    }
    return lastTelSuc;
}

function titleCase(str) {
    if (!str) return str;
    return str.toLowerCase().split(' ').map(function(word) {
      return (word.charAt(0).toUpperCase() + word.slice(1));
    }).join(' ');
  }