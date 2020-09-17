/**
 * Responsible for rendering the select region/sector/tabanca screen.
 */
'use strict';
/* global odkTables, util, odkCommon, odkData */

function display() {
    
    // Set the background to be a picture.
    //var body = $('body').first();
    //body.css('background', 'url(img/form_logo.png) fixed');
    doSanityCheck();
    initButtons();
}

function doSanityCheck() {
    console.log("Checking things");
    console.log(odkData);
}

function initButtons() {
    // Inclusion
    var btnInc = $('#btnInc');
    btnInc.on("click", function() {
        odkTables.launchHTML(null, 'config/assets/incBairroList.html');
    });
    // Follow-up
    var btnFU = $('#btnFU');
    btnFU.on("click", function() {
        odkTables.launchHTML(null, 'config/assets/fuBairroList.html');
    });
    // Sync
    var btnSync = $('#btnSync');
    btnSync.on("click", function() {
        odkCommon.doAction(null, "org.opendatakit.services.sync.actions.activities.SyncActivity", {"componentPackage": "org.opendatakit.services", "componentActivity": "org.opendatakit.services.sync.actions.activities.SyncActivity"});   
    });
}