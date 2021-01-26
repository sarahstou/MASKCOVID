/**
 * Responsible for rendering persons to visit
 */
'use strict';

var participants, date, bairro, tabz, zone, houseGroup, camo, assistant;
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
    head.prepend("<h1>" + tabz + " - " + houseGroup + " - " + camo + " </br> <h3> Pessoas");
    
    // populate list
    doSanityCheck();
    loadPersons();
}

function doSanityCheck() {
    console.log("Checking things");
    console.log(odkData);
}

function loadPersons() {
    // SQL to get persons
    var varNamesMaskTablet = "I.BAIRRO, I.CAMO, I.DOB, I.FAM, I.FNO, I.HHOID, I.HOUSEGRP, I.ID, I.IDOID, I.NOME, I.POID, I.RANGROUP, I.SEX, I.TABZ, ";
    var varNamesAgain = "A._id, A._savepoint_type, A.DATSEG";
    var sql = "SELECT " + varNamesMaskTablet + varNamesAgain + 
        " FROM MASKTABLET AS I" + 
        " LEFT JOIN MASKAGAIN AS A ON I.POID = A.POID" + 
        " WHERE I.TABZ = " + tabz + " AND I.CAMO = " + camo +
        " ORDER BY I.FAM, I.FNO";
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
            var ID = Number(result.getData(row,"ID"));
            var IDOID = result.getData(row,"IDOID");
            var NOME = titleCase(result.getData(row,"NOME"));
            var POID = result.getData(row,"POID");
            var RANGROUP = result.getData(row,"RANGROUP");
            var SEX = result.getData(row,"SEX");
            var TABZ = result.getData(row,"TABZ");

            var DATSEG = result.getData(row,"DATSEG");

            var p = {type: 'participant', rowId, savepoint, BAIRRO, CAMO, DOB, FAM, FNO, HHOID, HOUSEGRP, ID, IDOID, NOME, POID, RANGROUP, SEX, TABZ, DATSEG};
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
    odkData.arbitraryQuery('MASKAGAIN', sql, null, null, null, successFn, failureFn);
}

function populateView() {
    // list
    var ul = $('#li');
    $.each(participants, function() {
        var that = this;  

        // Check if called today
        var called = '';
        if (this.DATSEG != null & this.savepoint == "COMPLETE") {
            called = "visited";
        };
        
        // set text to display
        var displayText = setDisplayText(that);
        
        // list
        ul.append($("<li />").append($("<button />").attr('id',this.POID).attr('class', called + ' btn ' + this.type).append(displayText)));
                
        // Buttons
        var btn = ul.find('#' + this.POID);
        btn.on("click", function() {
            openForm(that);
        })        
    });
}

function setDisplayText(person) {
    var sex;
    if (person.SEX == 1) {
        sex = "Masculino";
    } else {
        sex = "Feminino";
    }
    
    var dob;
    if (person.DOB == "D:NS,M:NS,Y:NS" | person.DOB === null) {
        dob = "Não Sabe";
    } else {
        dob = formatDate(person.DOB);
    }
    
    var fam;
    if (person.FAM == null) {
        fam = "Não Sabe";
    } else {
        fam = person.FAM;
    }
    
    var displayText = "Nome: " + person.NOME + "<br />" + 
        "Sexo: " + sex + "<br />" +
        "Nacimento: " + dob + "<br />" +
        "Fam:" + fam;
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
    
    if (person.DATSEG != null) {
        odkTables.editRowWithSurvey(
            null,
            "MASKAGAIN",
            rowId,
            "MASKAGAIN",
            null,);
        } else {
        var defaults = getDefaults(person);
        console.log("Opening form with: ", defaults); 
        odkTables.addRowWithSurvey(
            null,
            "MASKAGAIN",
            "MASKAGAIN",
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
    defaults['POID'] = person.POID;
    defaults['RANGROUP'] = person.RANGROUP;
    defaults['SEX'] = person.SEX;
    defaults['TABZ'] = person.TABZ;

    defaults['ASSISTENTE'] = assistant;
    defaults['DATSEG'] = toAdate(date);
    return defaults;
}

function titleCase(str) {
    if (!str) return str;
    return str.toLowerCase().split(' ').map(function(word) {
      return (word.charAt(0).toUpperCase() + word.slice(1));
    }).join(' ');
}
