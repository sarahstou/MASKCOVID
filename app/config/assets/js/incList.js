/**
 * Responsible for rendering persons to look up
 */
'use strict';

var household, participants, bairro, tabz, zone, houseGroup, camo, fam, famName, hhoid;
function display() {
    console.log("TABZ list loading");
    bairro = util.getQueryParameter('bairro');
    tabz = util.getQueryParameter('tabz');
    zone = util.getQueryParameter('zone');
    houseGroup = util.getQueryParameter('houseGroup');
    camo = util.getQueryParameter('camo');
    fam = Number(util.getQueryParameter('fam'));
    famName = util.getQueryParameter('famName');
    hhoid = util.getQueryParameter('hhoid');
    
    var head = $('#main');
    head.prepend("<h1>" + tabz + " - " + houseGroup + " - " + camo + " </br> <h3> " + famName);
    // populate list
    loadHouseHold();
}

function loadHouseHold() {
    // SQL to get persons
    var varNames = "_id, _savepoint_type, BAIRRO, CAMO, FAM, HOUSEGRP, TABZ, VISITA";
    var sql = "SELECT " + varNames +
        " FROM MASKHOUSEHOLD" + 
        " WHERE BAIRRO = " + bairro + " AND TABZ = " + tabz + " AND HOUSEGRP = '" + houseGroup + "' AND CAMO = " + camo + " AND FAM = " + fam
        household = [];
    console.log("Querying database for household...");
    console.log(sql);
    var successFn = function( result ) {
        console.log("Found " + result.getCount() + " household");
        for (var row = 0; row < result.getCount(); row++) {
            var rowId = result.getData(row,"_id"); // row ID 
            var savepoint = result.getData(row,"_savepoint_type")

            var BAIRRO = result.getData(row,"BAIRRO");
            var CAMO = result.getData(row,"CAMO");
            var FAM = result.getData(row,"FAM");
            var HOUSEGRP = result.getData(row,"HOUSEGRP");
            var TABZ = result.getData(row,"TABZ");
            var VISITA = result.getData(row,"VISITA");

            var p = {type: 'household', rowId, savepoint, BAIRRO, CAMO, FAM, HOUSEGRP, TABZ, VISITA};
            household.push(p);
        }
        console.log("household:", household)
        loadPersons();
        return;
    }
    var failureFn = function( errorMsg ) {
        console.error('Failed to get household from database: ' + errorMsg);
        console.error('Trying to execute the following SQL:');
        console.error(sql);
        alert("Program error Unable to look up household.");
    }
    odkData.arbitraryQuery('MASKHOUSEHOLD', sql, null, null, null, successFn, failureFn);
}

function loadPersons() {
    // SQL to get persons
    var varNames = "_savepoint_type, DOB, ESTADO, FNO, HHOID, ID, MASC, NOME, SEX";
    var sql = "SELECT " + varNames +
        " FROM MASKINCL" + 
        " WHERE HHOID = " + hhoid + 
        " ORDER BY FNO";
    participants = [];
    console.log("Querying database for participants...");
    console.log(sql);
    var successFn = function( result ) {
        console.log("Found " + result.getCount() + " participants");
        for (var row = 0; row < result.getCount(); row++) {
            var savepoint = result.getData(row,"_savepoint_type");
            
            var DOB = result.getData(row,"DOB");
            var ESTADO = result.getData(row,"ESTADO");
            var FNO = result.getData(row,"FNO");
            var HHOID = result.getData(row,"HHOID");
            var ID = result.getData(row,"ID");
            var MASC = result.getData(row,"MASC");
            var NOME = titleCase(result.getData(row,"NOME"));
            var SEX = result.getData(row,"SEX");

            var p = {type: 'participant', savepoint, DOB, ESTADO, FNO, HHOID, ID, MASC, NOME, SEX};
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
    odkData.arbitraryQuery('MASKINCL', sql, null, null, null, successFn, failureFn);
}

function populateView() {
    
    // check if all visited
    const visitedPeople = [];
    for (const item of participants) {
        if (item.savepoint == "COMPLETE" & item.ESTADO != null) {
            visitedPeople.push({
                savepoint: item.savepoint,
                ESTADO: item.ESTADO
            });
        }
    }  

    // begin inclusion button
    var ulh = $('#household');
    $.each(household, function() {
        var that = this;  
        
        // Check if visited today      
        var visited = '';
        if (visitedPeople.length == participants.length | this.VISITA == 2) {
            visited = "visited";
        };

        // list
        ulh.append($("<li />").append($("<button />").attr('id',this.rowId).attr('class', visited + ' btn ' + this.type).append("Comece a inclusão")));
        
        // Buttons
        var btn = ulh.find('#' + this.rowId);
        btn.on("click", function() {
            openForm(that);
        })
    });

    // list
    var ul = $('#li');
    $.each(participants, function() {
        var that = this;  
        // Check if called today
        var visited = '';
        if (this.savepoint == "COMPLETE" & this.ESTADO != null | household[0]["VISITA"] == 2) {
            visited = "visited";
        };

        // set text to display
        var displayText = setDisplayText(that);
        
        // list
        ul.append($("<li />").append($("<button />").attr('id',this.HHOID).attr('class', visited + ' btn ' + this.type).append(displayText)));      
    });
}


function setDisplayText(person) {
   var dob;
    if (person.DOB == "D:NS,M:NS,Y:NS" | person.DOB === null) {
        dob = "Não Sabe";
    } else {
        dob = formatDate(person.DOB);
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
        "FNO: " + person.FNO + "<br />" +
        "ID: " + person.ID;
    return displayText
}

function formatDate(adate) {
    var d = adate.slice(2, adate.search("M")-1);
    var m = adate.slice(adate.search("M")+2, adate.search("Y")-1);
    var y = adate.slice(adate.search("Y")+2);
    var date = d + "/" + m + "/" + y;
    return date;
}

function openForm(household) {
    console.log("Preparing form for: ", household);

    var rowId = household.rowId;
    var tableId = 'MASKHOUSEHOLD';
    var formId = 'MASKHOUSEHOLD';
    
    odkTables.editRowWithSurvey(
        null,
        tableId,
        rowId,
        formId,
        null,);
}

function titleCase(str) {
    if (!str) return str;
    return str.toLowerCase().split(' ').map(function(word) {
      return (word.charAt(0).toUpperCase() + word.slice(1));
    }).join(' ');
  }