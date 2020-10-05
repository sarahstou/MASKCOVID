/**
 * Responsible for rendering persons to look up
 */
'use strict';

var participants, date, bairro, tabz, zone, houseGroup, camo, fam, famName, assistant, random;
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
    assistant = util.getQueryParameter('assistant');
    random = util.getQueryParameter('random');
    
    var head = $('#main');
    head.prepend("<h1>" + tabz + " - " + houseGroup + " - " + camo + " - " + fam + " </br> <h2> "+ getGroup(random) + " </br> <h3> "+ famName );
    // populate list
    loadPersons();
}

function getGroup(random) {
    var group;
    if (random == 1) {
        group = "Grupo de intervenção";
    } else if (random == 2) {
        group = "Grupo de controle";
    } else {
        group = "Faltando informação de grupo"
    }
    return group;
}

function loadPersons() {
    // SQL to get persons
    var varNamesIncl = "I.ACCEPT, I.BAIRRO, I.CAMO, I.DOB, I.FAM, I.FNO, I.HHOID, I.HOUSEGRP, I.ID, I.IDOID, I.NOME, I.NOVONUM1, I.NOVONUM2, I.OBS_IDADE , I.POID, I.SEX, I.TABZ, I.TELE1, I.TELE2, ";
    var varNamesHH = "H.DATEX, ";
    var varNamesFU = "F._id, F._savepoint_type, F.COVID, F.DATSEG, F.ESTADO, F.FU, F.GETRESULTS, F.LASTINTERVIEW, F.POSSIVEL, F.TESTRESUL";
    var sql = "SELECT " + varNamesIncl + varNamesHH + varNamesFU + 
        " FROM MASKINCL AS I" + 
        " LEFT JOIN MASKFU AS F ON I.POID = F.POID" + 
        " INNER JOIN MASKHOUSEHOLD AS H ON I.HHOID = H.HHOID" +
        " WHERE I.BAIRRO = " + bairro + " AND I.TABZ = " + tabz + " AND I.HOUSEGRP = '" + houseGroup + "' AND I.CAMO = " + camo + " AND I.FAM = " + fam + " AND I.OBS_IDADE IS NULL AND (I.ACCEPT != 2 OR I.ACCEPT IS NULL) AND I.ESTADO IS NOT NULL" +
        " GROUP BY I.POID HAVING MAX(F.FU) OR F.FU IS NULL" +
        " ORDER BY I.FAM";
    participants = [];
    console.log("Querying database for participants...");
    console.log(sql);
    var successFn = function( result ) {
        console.log("Found " + result.getCount() + " participants");
        for (var row = 0; row < result.getCount(); row++) {
            var rowId = result.getData(row,"_id"); // row ID 
            var savepoint = result.getData(row,"_savepoint_type")
            
            var BAIRRO = result.getData(row,"BAIRRO");
            var CAMO = result.getData(row,"CAMO");
            var DOB = result.getData(row,"DOB");
            var FAM = result.getData(row,"FAM");
            var FNO = result.getData(row,"FNO");
            var HHOID = result.getData(row,"HHOID");
            var HOUSEGRP = result.getData(row,"HOUSEGRP");
            var IDOID = result.getData(row,"IDOID");
            var ID = Number(result.getData(row,"ID"));
            var NOME = titleCase(result.getData(row,"NOME"));
            var NOVONUM1 = result.getData(row,"NOVONUM1");
            var NOVONUM2 = result.getData(row,"NOVONUM2");
            var POID = result.getData(row,"POID");
            var SEX = result.getData(row,"SEX");
            var TABZ = result.getData(row,"TABZ");
            var TELE1 = result.getData(row,"TELE1");
            var TELE2 = result.getData(row,"TELE2");

            var DATEX = result.getData(row,"DATEX");

            var COVID = result.getData(row,"COVID");
            var DATSEG = result.getData(row,"DATSEG");
            var ESTADO = result.getData(row,"ESTADO");
            var FU = result.getData(row,"FU");
            var GETRESULTS = result.getData(row,"GETRESULTS");
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
            } else if (FU == null) {
                var datexD = Number(DATEX.slice(2, DATEX.search("M")-1));
                var datexM = DATEX.slice(DATEX.search("M")+2, DATEX.search("Y")-1);
                var datexY = DATEX.slice(DATEX.search("Y")+2);
                var FUDate = new Date(datexY, datexM-1, datexD + 42);
                var LastFU = new Date(datexY, datexM-1, datexD);
            }   else {
                var segD = Number(DATSEG.slice(2, DATSEG.search("M")-1));
                var segM = DATSEG.slice(DATSEG.search("M")+2, DATSEG.search("Y")-1);
                var segY = DATSEG.slice(DATSEG.search("Y")+2);
                var FUDate = new Date(segY, segM-1, segD + 42);
                var LastFU = new Date(segY, segM-1, segD);
            }
            // Set 4 month date for ending FU
            var datexD = Number(DATEX.slice(2, DATEX.search("M")-1));
            var datexM = DATEX.slice(DATEX.search("M")+2, DATEX.search("Y")-1);
            var datexY = DATEX.slice(DATEX.search("Y")+2);
            var FUEnd = new Date(datexY, datexM-1, datexD + 122);

            var p = {type: 'participant', rowId, savepoint, FUDate, FUEnd, LastFU, BAIRRO, CAMO, DOB, FAM, FNO, HHOID, HOUSEGRP, ID, IDOID, NOME, NOVONUM1, NOVONUM2, POID, SEX, TABZ, TELE1, TELE2, DATEX, COVID, DATSEG, ESTADO, FU, GETRESULTS, LASTINTERVIEW, POSSIVEL, TESTRESUL};
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
    odkData.arbitraryQuery('MASKFU', sql, null, null, null, successFn, failureFn);
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
        if (this.TESTRESUL == "3" & this.POSSIVEL != "2" & called != "called" | this.GETRESULTS == "1") {
            getResults = "getResults";
        };
        
        // set text to display
        var displayText = setDisplayText(that);
        
        // list
        if (this.FUDate <= today & 
            this.LastFU < this.FUEnd & 
            ((this.ESTADO != "2" & this.ESTADO != "3") | this.POSSIVEL == "2" | this.TESTERESUL == "3") | this.DATSEG == todayAdate) {
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
    if (person.DATEX == "D:NS,M:NS,Y:NS" | person.DATEX === null) {
        datinc = "Não Sabe";
    } else {
        datinc = formatDate(person.DATEX);
    }

    var sex;
    if (person.SEX == 1) {
        sex = "Masculino"
    } else {
        sex = "Feminino"
    }

    var teleNumber;
    if (person.TELE1) {
        teleNumber = person.TELE1
    } if (person.TELE2) {
        teleNumber = teleNumber + "   " + person.TELE2
    } if (person.NOVONUM1) {
        teleNumber = teleNumber + "   " + person.NOVONUM1
    } if (person.NOVONUM2) {
        teleNumber = teleNumber + "   " + person.NOVONUM2
    } if (teleNumber == undefined) {
        teleNumber = "Não Sabe"
    }

    var displayText = "Nome: " + person.NOME + "<br />" + 
        "Sexo: " + sex + "<br />" +
        "Nacimento: " + dob + "<br />" +
        "Inclusão: " + datinc + "<br />" +
        "Telefone: " + teleNumber;
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
    var tableId = 'MASKFU';
    var formId = 'MASKFU';
    
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
        if (person.TESTRESUL == "3" & person.POSSIVEL != "2") {
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
    defaults['DOB'] = person.DOB;
    defaults['FAM'] = person.FAM;
    defaults['FNO'] = person.FNO;
    defaults['HHOID'] = person.HHOID;
    defaults['HOUSEGRP'] = person.HOUSEGRP;
    defaults['ID'] = person.ID;
    defaults['IDOID'] = person.IDOID
    defaults['NOME'] = person.NOME;
    defaults['NOVONUM1'] = person.NOVONUM1;
    defaults['NOVONUM2'] = person.NOVONUM2;
    defaults['POID'] = person.POID;
    defaults['SEX'] = person.SEX;
    defaults['TABZ'] = person.TABZ;
    defaults['TELE1'] = person.TELE1;
    defaults['TELE2'] = person.TELE2;

    defaults['DATEX'] = person.DATEX

    defaults['ASSISTENTE'] = assistant;
    defaults['DATSEG'] = toAdate(date);
    defaults['FU'] = getFU(person);
    defaults['LASTINTERVIEW'] = getLastInterview(person);
    return defaults;
}

function getFU(person) {
    var FU;
    if (person.FU == null) {
        FU = 1;
    } else if (person.COVID != null & person.TESTRESUL != "3")  {
        FU = Math.floor(person.FU) + 1;
    } else {
        FU = person.FU + 0.01;
    }
    return FU;
} 

function getLastInterview(person) {
    var lastInterview;
    if (person.FU == null) {
        lastInterview = person.DATEX;
    } else if (person.COVID != null & person.TESTRESUL != "3")  {
        lastInterview = person.DATSEG;
    } else {
        lastInterview = person.LASTINTERVIEW;
    }
    return lastInterview;
}

function titleCase(str) {
    if (!str) return str;
    return str.toLowerCase().split(' ').map(function(word) {
      return (word.charAt(0).toUpperCase() + word.slice(1));
    }).join(' ');
}
