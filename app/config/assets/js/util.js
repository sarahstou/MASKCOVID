/* global odkData*/
/**
 * Various functions that we might need across screens.
 */
'use strict';

var util = {};
util.DEBUG = false;
/**
 * Get a string to append to a url that will contain information the date and
 * time. The values can then be retrieved using getQueryParameter.
 */
util.setQuerystringParams = function(date, bairro, tabz, zone, houseGroup, camo, fam, famName, hhoid, assistant, random) {

    var that = this;
    var first = true;
    var result;
    var adaptProps = {};

    // Initialize the properties object
    if (date) {
        adaptProps['date'] = date;
    }  
    
    if (bairro) {
        adaptProps['bairro'] = bairro;
    }

    if (tabz) {
        adaptProps['tabz'] = tabz;
    }  

    if (zone) {
        adaptProps['zone'] = zone;
    }  

    if (houseGroup) {
        adaptProps['houseGroup'] = houseGroup;
    }  

    if (camo) {
        adaptProps['camo'] = camo;
    }  

    if (fam) {
        adaptProps['fam'] = fam;
    }  

    if (famName) {
        adaptProps['famName'] = famName;
    } 

    if (hhoid) {
        adaptProps['hhoid'] = hhoid;
    } 

    if (assistant) {
        adaptProps['assistant'] = assistant;
    } 

    if (random) {
        adaptProps['random'] = random;
    } 

    for (var prop in adaptProps) {
        if (adaptProps[prop] !== null && adaptProps[prop] !== undefined) {
            if (first)
            {
                result = '?' + prop + '=' + encodeURIComponent(adaptProps[prop]);
                first = false;
            } else {
                result += '&' + prop + '=' + encodeURIComponent(adaptProps[prop]);
            }
        }
    }
    return result;
};


/**
 * Get the query parameter from the url. Note that this is kind of a hacky/lazy
 * implementation that will fail if the key string appears more than once, etc.
 */
util.getQueryParameter = function(key) {
    var href = document.location.search;
    var startIndex = href.search(key);
    if (startIndex < 0) {
        console.log('requested query parameter not found: ' + key);
        return null;
    }

    href = href.substring(1, href.length);

    var keys = href.split('&');

    for (var i = 0; i < keys.length; i++) {
        var keyStrIdx = keys[i].search('=');
        if (keyStrIdx <= 0) {
            continue;
        } else {
            var parsedKey = keys[i].substring(0, keyStrIdx);
            if (parsedKey === key) {
                return decodeURIComponent(keys[i].substring(keyStrIdx+1, keys[i].length));
            }
        }
    }

    return null;
};
