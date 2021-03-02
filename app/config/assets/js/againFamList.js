/**
 * Responsible for rendering the select region screen 
 */
'use strict';

var participants, masterFamList, date, bairro, tabz, zone, houseGroup, camo, assistant;
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
    var varNamesMaskTablet = "I.BAIRRO, I.CAMO, I.FAM, I.HOUSEGRP, I.TABZ, ";
    var varNamesAgain = "A._savepoint_type, A.ESTADO";
    var sql = "SELECT " + varNamesMaskTablet + varNamesAgain + 
        " FROM MASKTABLET AS I" + 
        " LEFT JOIN MASKAGAIN AS A ON I.POID = A.POID" +
        " WHERE I.TABZ = " + tabz + " AND I.HOUSEGRP = '" + houseGroup + "'" + " AND I.CAMO = " + camo +
        " ORDER BY I.FAM, I.FNO";
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

            var ESTADO = result.getData(row,"ESTADO");
            
            var p = {type: 'participant', savepoint, BAIRRO, CAMO, FAM, HOUSEGRP, TABZ, ESTADO};
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
    odkData.arbitraryQuery('MASKAGAIN', sql, null, null, null, successFn, failureFn);
}

function initButtons() {
    // Zone buttons
    var ul = $('#li');
    // Button for 'other'
    ul.append($("<li />").append($("<button />").attr('id',"OU").attr('class','btn' + bairro).append("Outro famílias").append(" " + getCount(0))));
    // Buttons
    var btn = ul.find('#' + "OU");
    btn.on("click", function() {
        var queryParams = util.setQuerystringParams(date, bairro, tabz, zone, houseGroup, camo, "0", "Outro famílias", null, assistant);
        odkTables.launchHTML(null, 'config/assets/againList.html' + queryParams);
    })        


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
            var queryParams = util.setQuerystringParams(date, that.bairro, that.tabz, that.zone, that.houseGroup, that.camo, that.fam, that.famName, null, assistant);
            odkTables.launchHTML(null, 'config/assets/againList.html' + queryParams);
        })        
    });
}

function getCount(fam) {
    var totalList = participants.filter(person => person.BAIRRO == bairro & person.TABZ == tabz & person.HOUSEGRP == houseGroup & person.CAMO == camo & person.FAM == fam);
    var total = totalList.length;
    var checked = participants.filter(person => person.BAIRRO == bairro & person.TABZ == tabz & person.HOUSEGRP == houseGroup & person.CAMO == camo & person.FAM == fam & person.ESTADO != null & person.savepoint == "COMPLETE").length;
    var count = "(" + checked + "/" + total + ")";
    return count;
}

function titleCase(str) {
    if (!str) return str;
    return str.toLowerCase().split(' ').map(function(word) {
      return (word.charAt(0).toUpperCase() + word.slice(1));
    }).join(' ');
  }