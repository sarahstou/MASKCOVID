/**
 * This is the file that will create the list view for the table.
 */
/* global $, odkCommon, odkData, odkTables, util */
 (function() {
'use strict';

window.listViewLogic = {
    tableId: null,
    formId: null,
    limitKey: null,
    offsetKey: null,
    rowCountKey: null,
    queryKey: null,
    searchKey: null,
    queryStmt: 'stmt',
    queryArgs: 'args',

    rowCount: 0,  
    limit: -1,
    offset: 0,

    queryToRun: null,
    queryToRunParams: null,

    listQuery: null,
    listQueryParams: null,

    searchParams: null,

    listElemId: null,
    imgId: null,
    searchTxtId: null,
    headerId: null,
    limitId: null,
    prevBtnId: null,
    nextBtnId: null,
    navTextLimit: null,
    navTextOffset: null,
    navTextCnt: null,
    showEditAndDelButtons: false,

    lastvisit: null,
    DetailView: null,
    
    hdrLabel: null,
    hdrColId: null,
    firstDetLabel1: null,
    firstDetColId1: null,
    firstDetLabel2: null,
    firstDetColId2: null,  
    secondDetLabel1: null,
    secondDetColId1: null,
    secondDetLabel2: null,
    secondDetColId2: null,
    thirdDetLabel1: null,
    thirdDetColId1: null,
    thirdDetLabel2: null,
    thirdDetColId2: null,      
    thirdDetLabel3: null,
    thirdDetColId3: null,
    
    
    setTableId: function(tableName) {
        if (tableName === null || tableName === undefined ||
            tableName.length === 0) {
            console.log('setTableId: invalid table name');
            return;
        }
        
        var that = this;

        that.tableId = tableName;
        that.limitKey = that.tableId + ':limit';
        that.offsetKey = that.tableId + ':offset';
        that.rowCountKey = that.tableId + ':rowCount';
        that.queryKey = that.tableId + ':query';
        that.searchKey = that.tableId + ':search';
    },
   
    setFormId: function(formName) {
        if (formName === null || formName === undefined ||
            formName.length === 0) {
            console.log('setFormId: invalid form name');
            return;
        }
        
        var that = this;
        
        that.formId = formName;
    },
    
    setListQuery: function(queryToUse) {
        if (queryToUse === null || queryToUse === undefined ||
            queryToUse.length === 0) {
            console.log('setListQuery: invalid list query');
            return;
        }

        var that = this;

        that.listQuery = queryToUse;
    },

    setListQueryParams: function(paramsToUse) {
        if (paramsToUse === null || paramsToUse === undefined ||
            paramsToUse.length === 0) {
            console.log('setListQueryParams: invalid list query params');
            return;
        }

        var that = this;

        that.listQueryParams = paramsToUse;
    },

    setSearchParams: function(searchParamsToUse) {
        if (searchParamsToUse === null || searchParamsToUse === undefined ||
            searchParamsToUse.length === 0) {
            console.log('setSearchParams: invalid search params to use');
            return;
        }

        var that = this;

        that.searchParams = searchParamsToUse;
    },

    setListElement: function(listElemIdToUse) {
        if (listElemIdToUse === null || listElemIdToUse === undefined ||
            listElemIdToUse.length === 0) {
            console.log('setListElement: invalid list element id');
            return;
        }

        var that = this;

        that.listElemId = listElemIdToUse;
    },

    setSearchTextElement: function(searchTxtIdToUse) {
        if (searchTxtIdToUse === null || searchTxtIdToUse === undefined ||
            searchTxtIdToUse.length === 0) {
            console.log('setSearchTextElement: invalid search text id');
            return;
        }

        var that = this;

        that.searchTxtId = searchTxtIdToUse;
    },

    setHeaderElement: function(headerIdToUse) {
        if (headerIdToUse === null || headerIdToUse === undefined ||
            headerIdToUse.length === 0) {
            console.log('setHeaderElement: invalid header id');
            return;
        }

        var that = this;

        that.headerId = headerIdToUse;
    },

    setLimitElement: function(limitIdToUse) {
        if (limitIdToUse === null || limitIdToUse === undefined ||
            limitIdToUse.length === 0) {
            console.log('setLimitElement: invalid header id');
            return;
        }

        var that = this;

        that.limitId = limitIdToUse;
    },

    setPrevAndNextButtons: function(prevBtnIdToUse, nextBtnIdToUse) {
        if (prevBtnIdToUse === null || prevBtnIdToUse === undefined ||
            prevBtnIdToUse.length === 0) {
            console.log('setPrevAndNextButtons: invalid prev button id');
            return;
        }

        if (nextBtnIdToUse === null || nextBtnIdToUse === undefined || 
            nextBtnIdToUse.length === 0) {
            console.log('setPrevAndNextButtons: invalid next button id');
            return;
        }

        var that = this;

        that.prevBtnId = prevBtnIdToUse;
        that.nextBtnId = nextBtnIdToUse;
    },

    setNavTextElements: function(txtLimit, txtOffset, txtCnt) {
        if (txtLimit === null || txtLimit === undefined ||
            txtLimit.length === 0) {
            console.log('setNavTextElements: invalid text limit id');
            return;
        }

        if (txtOffset === null || txtOffset === undefined || 
            txtOffset.length === 0) {
            console.log('setNavTextElements: invalid text offset id');
            return;
        }

        if (txtCnt === null || txtCnt === undefined || 
            txtCnt.length === 0) {
            console.log('setNavTextElements: invalid text cnt id');
            return;
        }

        var that = this;

        that.navTextLimit = txtLimit;
        that.navTextOffset = txtOffset;
        that.navTextCnt = txtCnt;
    },

    showEditAndDeleteButtons: function(showButtons, formIdToUse){
        if (showButtons === null || showButtons === undefined) {
            return;
        }

        var that = this;
        if (showButtons === true) {
            that.showEditAndDelButtons = showButtons;
            if (formIdToUse !== null || formIdToUse !== undefined) {
                that.formId = formIdToUse;
            }
        }
    },
    
    setLastvisit: function(lastvisit) {
    	var that = this;
    	if (lastvisit !== null && lastvisit !==undefined && lastvisit.length !==0) {
    		that.lastvisit = lastvisit;
    	}
    },
    
    detailView: function(detailView){
        var that = this;
        if (detailView !== null && detailView !==undefined && detailView.length !==0) {
            that.detailView = detailView;
        }
    },
    
    setColIdsToDisplayInList: function(headerLabel, headerColId, 
            firstDetailLabel1, firstDetailColId1, firstDetailLabel2, firstDetailColId2, 
            secondDetailLabel1, secondDetailColId1, secondDetailLabel2, secondDetailColId2,
            thirdDetailLabel1, thirdDetailColId1, thirdDetailLabel2, thirdDetailColId2, thirdDetailLabel3, thirdDetailColId3 ) {
        var that = this;

        if (headerLabel !== null && headerLabel !== undefined && headerLabel.length !== 0) {
            that.hdrLabel = headerLabel;
        }

        if (headerColId !== null && headerColId !== undefined && headerColId.length !== 0) {
            that.hdrColId = headerColId;
        }

        if (firstDetailLabel1 !== null && firstDetailLabel1 !== undefined && firstDetailLabel1.length !== 0) {
            that.firstDetLabel1 = firstDetailLabel1;
        }

        if (firstDetailColId1 !== null && firstDetailColId1 !== undefined && firstDetailColId1.length !== 0) {
            that.firstDetColId1 = firstDetailColId1;
        }
        
        if (firstDetailLabel2 !== null && firstDetailLabel2 !== undefined && firstDetailLabel2.length !== 0) {
            that.firstDetLabel2 = firstDetailLabel2;
        }

        if (firstDetailColId2 !== null && firstDetailColId2 !== undefined && firstDetailColId2.length !== 0) {
            that.firstDetColId2 = firstDetailColId2;
        }

        if (secondDetailLabel1 !== null && secondDetailLabel1 !== undefined && secondDetailLabel1.length !== 0) {
            that.secondDetLabel1 = secondDetailLabel1;
        }

        if (secondDetailColId1 !== null && secondDetailColId1 !== undefined && secondDetailColId1.length !== 0) {
            that.secondDetColId1 = secondDetailColId1;
        }
        
        if (secondDetailLabel2 !== null && secondDetailLabel2 !== undefined && secondDetailLabel2.length !== 0) {
            that.secondDetLabel2 = secondDetailLabel2;
        }

        if (secondDetailColId2 !== null && secondDetailColId2 !== undefined && secondDetailColId2.length !== 0) {
            that.secondDetColId2 = secondDetailColId2;
        }
        
        if (thirdDetailLabel1 !== null && thirdDetailLabel1 !== undefined && thirdDetailLabel1.length !== 0) {
            that.thirdDetLabel1 = thirdDetailLabel1;
        }

        if (thirdDetailColId1 !== null && thirdDetailColId1 !== undefined && thirdDetailColId1.length !== 0) {
            that.thirdDetColId1 = thirdDetailColId1;
        }
        
        if (thirdDetailLabel2 !== null && thirdDetailLabel2 !== undefined && thirdDetailLabel2.length !== 0) {
            that.thirdDetLabel2 = thirdDetailLabel2;
        }

        if (thirdDetailColId2 !== null && thirdDetailColId2 !== undefined && thirdDetailColId2.length !== 0) {
            that.thirdDetColId2 = thirdDetailColId2;
        }
        
        if (thirdDetailLabel3 !== null && thirdDetailLabel3 !== undefined && thirdDetailLabel3.length !== 0) {
            that.thirdDetLabel3 = thirdDetailLabel3;
        }

        if (thirdDetailColId3 !== null && thirdDetailColId3 !== undefined && thirdDetailColId3.length !== 0) {
            that.thirdDetColId3 = thirdDetailColId3;
        }

    },

    setImageToDisplayInList: function(imgIdToUse) {
        var that = this;
        if (imgIdToUse !== null && imgIdToUse !== undefined && imgIdToUse.length !== 0) {
            that.imgId = imgIdToUse;
        }
    },

    makeCntQuery: function(queryToWrap) {
        if (queryToWrap !== null && queryToWrap !== undefined &&
            queryToWrap.length > 0) {
            return 'SELECT COUNT(*) AS cnt FROM (' + queryToWrap + ')';
        } else  {
            return null;
        }
    },

    makeSearchQuery: function(searchQueryToWrap) {
        var that = this;
        if (searchQueryToWrap !== null && searchQueryToWrap !== undefined &&
            searchQueryToWrap.length > 0) {
            if (searchQueryToWrap.indexOf('WHERE') >= 0) {
                return searchQueryToWrap + ' AND ' + that.searchParams;
            } else {
                return searchQueryToWrap + ' WHERE ' + that.searchParams;
            }
        } else {
            return null;
        }
    },

    processPromises: function(cntResultSet, resultSet) {
        var that = this;
        // Set the text for the number of rows
        if (cntResultSet.getCount() > 0) {
            that.rowCount = parseInt(cntResultSet.getData(0, 'cnt'));
        } else {
            that.rowCount = 0;
        }

        odkCommon.setSessionVariable(that.rowCountKey, that.rowCount);

        if (that.rowCount === 0) {
            that.offset = 0;
            odkCommon.setSessionVariable(that.offsetKey, that.offset);
        }

        // Display the results in the list
        that.updateNavButtons();
        
        // Right now we have a problem with having the count(*)
        // respect group privileges
        // This is a hack until I can fix this!
        var actualResultCount = resultSet.getCount();
        that.updateNavText(actualResultCount);
        that.clearRows();

        if (resultSet.getCount() === 0) {
            console.log('No ' + util.formatDisplayText(that.tableId));
            var note = $('<li>');
            note.attr('class', 'note');
            note.text('No ' + util.formatDisplayText(that.tableId));
            $(that.listElemId).append(note);

        } else {
            that.displayGroup(resultSet);
        }
    },

    appendUriParamsToListQuery: function() {
        var that = this;
        var sqlUriParamStmt = '';
        var retUriParams = util.getAllQueryParameters();

        if (retUriParams === null || retUriParams === undefined ||
            $.isEmptyObject(retUriParams) === true) {
            return sqlUriParamStmt;
        }

        var uriKeys = Object.keys(retUriParams);

        if (that.listQuery.indexOf('WHERE') < 0) {
            sqlUriParamStmt = ' WHERE ';
        } else {
            sqlUriParamStmt = ' AND ';
        }
        
        for (var i = 0; i < uriKeys.length; i++) {
            var uKey = uriKeys[i];

            sqlUriParamStmt += uKey + ' = ?';
            
            if (i < uriKeys.length - 1) {
                sqlUriParamStmt += ' AND ';
            }
        } 
        return sqlUriParamStmt;
    },

    getUriQueryParams: function() {
        var uriArgs = [];
        var retUriParams = util.getAllQueryParameters();

        if (retUriParams === null || retUriParams === undefined) {
            return;
        }

        var uriKeys = Object.keys(retUriParams);
        
        for (var i = 0; i < uriKeys.length; i++) {
            var uKey = uriKeys[i];
            uriArgs.push(retUriParams[uKey]);
        } 

        return uriArgs;
    },

    resumeFn: function(fIdxStart) {
        var that = this;
        console.log('resumeFn called. fIdxStart: ' + fIdxStart);

        // Use session variables if came back from rotation
        if (fIdxStart === 'init') {
            var searchText = odkCommon.getSessionVariable(that.searchKey);
            if (searchText !== null && searchText !== undefined && searchText.length !== 0) {
                $(that.searchTxtId).val(searchText);
            } 

            that.rowCount = odkCommon.getSessionVariable(that.rowCountKey);
            if (that.rowCount === null || that.rowCount === undefined) {
                that.rowCount = 0;
                odkCommon.setSessionVariable(that.rowCountKey, that.rowCount);
            } else {
                that.rowCount = parseInt(that.rowCount);
            }

            that.offset = odkCommon.getSessionVariable(that.offsetKey);
            if (that.offset === null ||that.offset === undefined) {
                that.offset = 0;
                odkCommon.setSessionVariable(that.offsetKey, that.offset);
            } else {
                that.offset = parseInt(that.offset);
            }
    
            that.limit = odkCommon.getSessionVariable(that.limitKey);
            if (that.limit === null || that.limit === undefined) {
                that.limit = -1;
                if (that.limitId !== null && that.limitId !== undefined && 
                    that.limitId.length !== 0) {
                    var limitSelected = that.limitId + ' option:selected';
                    that.limit = parseInt($(limitSelected).text());
                }

                odkCommon.setSessionVariable(that.limitKey, that.limit);
            } else {
                if (that.limitId !== null && that.limitId !== undefined && 
                    that.limitId.length !== 0) {
                    $(that.limitId).val(that.limit);
                }
 
                that.limit = parseInt(that.limit);
            }

            // Set header
            if (that.headerId !== null && that.headerId !== undefined && that.headerId.length !== 0) {
                // Localize Header Text
                var headerText = util.formatDisplayText(that.tableId);
                var locale = odkCommon.getPreferredLocale();
                var localeHeaderText = odkCommon.localizeText(locale, that.tableId);
                if (localeHeaderText !== null && localeHeaderText !== undefined) {
                    headerText = localeHeaderText;
                }
                $(that.headerId).text(headerText);
            }

            var queryToRunParts = odkCommon.getSessionVariable(that.queryKey);
            that.queryToRun = null;
            that.queryToRunParams = null;
            if (queryToRunParts !== null && queryToRunParts !== undefined) {
                queryToRunParts = JSON.parse(queryToRunParts);
                that.queryToRun = queryToRunParts[that.queryStmt];
                that.queryToRunParams = queryToRunParts[that.queryArgs];
            } else {
                queryToRunParts = {};
            }

            if (that.queryToRun === null || that.queryToRun ===  undefined ||
                that.queryToRunParams === null || that.queryToRunParams === undefined) {
                // Init display
                that.queryToRunParams = [];
                if (that.listQueryParams !== null && that.listQueryParams !== undefined &&
                    that.listQueryParams.length !== 0) {
                    that.queryToRunParams = that.queryToRunParams.concat(that.listQueryParams);
                }
                var addSql = that.appendUriParamsToListQuery();
                that.queryToRunParams = that.queryToRunParams.concat(that.getUriQueryParams());

                that.queryToRun = that.listQuery + addSql;
                queryToRunParts[that.queryStmt] = that.queryToRun;
                queryToRunParts[that.queryArgs] = that.queryToRunParams;
                odkCommon.setSessionVariable(that.queryKey, JSON.stringify(queryToRunParts));
            } 
        }

        var cntQueryToRun = that.makeCntQuery(that.queryToRun);

        var cntQueryPromise = new Promise(function(resolve, reject) {
            odkData.arbitraryQuery(that.tableId, 
                cntQueryToRun, that.queryToRunParams, null, null, resolve, reject);
        });

        var queryPromise = new Promise(function(resolve, reject)  {
            odkData.arbitraryQuery(that.tableId, 
                that.queryToRun, that.queryToRunParams, that.limit, that.offset, resolve, reject);
        });

        Promise.all([cntQueryPromise, queryPromise]).then(function(resultArray) {
            that.processPromises(resultArray[0], resultArray[1]);

        }, function(err) {
            console.log('promises failed with error: ' +  err);
        });

        if (fIdxStart === 'init') {
            // We're also going to add a click listener on the wrapper ul that will
            // handle all of the clicks on its children.
            $(that.listElemId).click(function(e) {
                // wrap up the object so we can call closest()
                var jqueryObject = $(e.target);
                // we want the closest thing with class item_space, which we
                // have set up to have the row id
                var containingDiv = jqueryObject.closest('.item_space');
                var rowId = containingDiv.attr('rowId');
                console.log('clicked with rowId: ' + rowId);
                // make sure we retrieved the rowId
                if (rowId !== null && rowId !== undefined) {
                    // we'll pass null as the relative path to use the default file
                    if (that.detailView === true) {
                    	odkTables.openDetailView(null, that.tableId, rowId, 'config/tables/MIF/html/MIF_detail.html');
                    	console.log('opened detail view');
                    } else {
                    	odkTables.editRowWithSurvey(null, that.tableId, rowId, that.formId, null, null);	
                    }
                }
            });
        }
    },

    createLabel: function(lbl) {
        var retLbl = '';
        if (lbl !== null && lbl !== undefined && lbl.length !== 0) {
            retLbl = lbl + ': ';
        }

        return retLbl;
    },

    displayGroup: function(resultSet) {
        var that = this;
        var locale = odkCommon.getPreferredLocale();
        /* Number of rows displayed per 'chunk' - can modify this value */
        for (var i = 0; i < resultSet.getCount(); i++) {
 
        		/* Creates the item space */
        		var item = $('<li>');
        		item.attr('rowId', resultSet.getRowId(i));
        		item.attr('class', 'item_space');
        		item.text(that.createLabel(that.hdrLabel) + util.formatColIdForDisplay(that.hdrColId, i, resultSet, true));

        		if (that.showEditAndDelButtons === false)  {
        			/* Creates arrow icon (Nothing to edit here) */
        			var chevron = $('<img>');
        			var check = null;
        			var td = new Date();
                    var m = td.getMonth();
                    var d = td.getDate();
                    var y = td.getFullYear();

                    var today = new Date(y,m,d);
                    var visit = util.formatColIdForDisplay(that.lastvisit, i, resultSet, true);
                    if (visit !== '') {
                    	visit = new Date(visit.substring(0,4), visit.substring(5,7)-1, visit.substring(8,10));
                    }
        			if (today > visit) {
        				check = '1'
        			}
                    
        			if (check === '1') {
        				chevron.attr('src', odkCommon.getFileAsUrl('config/assets/img/white_arrow.png'));
        			} else {
        				chevron.attr('src', odkCommon.getFileAsUrl('config/assets/img/check_mark2.png'));
        			}
        			
        			
        			
        			chevron.attr('class', 'chevron');
        			item.append(chevron);
        		}
        		if (that.tableId === 'MIF') {
        			if (that.firstDetColId1 !== null && that.firstDetColId1 !== undefined && that.firstDetColId1.length !== 0) {
        				var field1 = $('<li>');
        				field1.attr('class', 'detail');
        				var f1Detail = util.formatColIdForDisplay(that.firstDetColId1, i, resultSet, true);
        				var f2Detail = util.formatColIdForDisplay(that.firstDetColId2, i, resultSet, true);
        				if (that.firstDetColId1 === 'RELA1') {
        					if (f1Detail === '') {
        						f1Detail = 'NS'
        					}
        					if (f2Detail === '') {
        						f2Detail = 'NS'
        					}
        				}
        	
        				field1.text(that.createLabel(that.firstDetLabel1) + f1Detail + '; ' + f2Detail);
        				item.append(field1);
        			}
        		} 
        		if (that.tableId === 'CRIANCA') {
            		if (that.firstDetColId1 !== null && that.firstDetColId1 !== undefined && that.firstDetColId1.length !== 0) {
            			var field1 = $('<li>');
            			field1.attr('class', 'detail');
            			var f1Detail = util.formatColIdForDisplay(that.firstDetColId1, i, resultSet, true);
            			if (that.firstDetColId1 === 'IDADE') {
            				if (f1Detail === '') {
            					f1Detail = 'NS'
            				}
            			}
            			field1.text(that.createLabel(that.firstDetLabel1) + f1Detail);
            			item.append(field1);
            		}
            	}
        		
        		if (that.tableId === 'MIF') {
        			if (that.secondDetColId1 !== null && that.secondDetColId1 !== undefined && that.secondDetColId1.length !== 0) {
        				var field2 = $('<li>');
        				field2.attr('class', 'detail');
        				var s1Detail = util.formatColIdForDisplay(that.secondDetColId1, i, resultSet, true);
        				var s2Detail = util.formatColIdForDisplay(that.secondDetColId2, i, resultSet, true);
        				if (that.secondDetColId1 === 'RELA2') {
        					if (s1Detail === '') {
        						s1Detail = 'NS'
        					}
        					if (s2Detail === '') {
        						s2Detail = 'NS'
        					}
        				}
                	
        				field2.text(that.createLabel(that.secondDetLabel1) + s1Detail + '; ' + s2Detail);
                		item.append(field2);
        			}
        		}
        		if (that.tableId === 'CRIANCA') {
            		if (that.secondDetColId1 !== null && that.secondDetColId1 !== undefined && that.secondDetColId1.length !== 0) {
            			var field2 = $('<li>');
            			field2.attr('class', 'detail');
                    	var s1Detail = util.formatColIdForDisplay(that.secondDetColId1, i, resultSet, true);
                    	if (that.secondDetColId1 === 'SEX') {
            				if (s1Detail === '1') {
            					s1Detail = 'Macho'
            				} else if (s1Detail === '2') {
            					s1Detail = 'Femea'
            				} else {
            					s1Detail = 'NS'
            				} 
            			}
                    	
                    	field2.text(that.createLabel(that.secondDetLabel1) + s1Detail);
                    	item.append(field2);
            		}
            	}
        		
        		if (that.tableId === 'MIF') {
        			if (that.thirdDetColId1 !== null && that.thirdDetColId1 !== undefined && that.thirdDetColId1.length !== 0) {
        				var field3 = $('<li>');
        				field3.attr('class', 'detail');
        				var t1Detail = util.formatColIdForDisplay(that.thirdDetColId1, i, resultSet, true);
        				var t2Detail = util.formatColIdForDisplay(that.thirdDetColId2, i, resultSet, true);
        				var t3Detail = util.formatColIdForDisplay(that.thirdDetColId3, i, resultSet, true);
        				if (that.thirdDetColId1 === 'MOR') {
        					if (t1Detail === '') {
        						t1Detail = 'NS'
        					}
        					if (t2Detail === '') {
        						t2Detail = 'NS'
        					}
        					if (t3Detail === '') {
        						t3Detail = 'NS'
        					}		
        				}
        			
        				field3.text(that.createLabel(that.thirdDetLabel1) + t1Detail + ' ' +
        						that.createLabel(that.thirdDetLabel2) + t2Detail + ' ' + 
        						that.createLabel(that.thirdDetLabel3) + t3Detail);
        				item.append(field3);
        			}
        		}
        		if (that.tableId === 'CRIANCA') {
        			if (that.thirdDetColId1 !== null && that.thirdDetColId1 !== undefined && that.thirdDetColId1.length !== 0) {
        				var field3 = $('<li>');
        				field3.attr('class', 'detail');
        				var t1Detail = util.formatColIdForDisplay(that.thirdDetColId1, i, resultSet, true);
        				if (that.thirdDetColId1 === 'NOMEMAE') {
        					if (t1Detail === '') {
        						t1Detail = 'NS'
        					}
        				}
        			
        				field3.text(that.createLabel(that.thirdDetLabel1) + t1Detail);
        				item.append(field3);
        			}
        		}
        		
        		$(that.listElemId).append(item);
        		
        		
        		// don't append the last one to avoid the fencepost problem
        		var borderDiv = $('<div>');
        		borderDiv.addClass('divider');
        		$(that.listElemId).append(borderDiv);
        }
    },

    clearRows: function() {
        var that = this;
        $(that.listElemId).empty();
    },

    updateNavText: function(actualResultSetCnt) {
        var that = this;

        if (that.navTextCnt !== null && that.navTextCnt !== undefined &&
            that.navTextCnt.length !== 0) {
            $(that.navTextCnt).text(that.rowCount);
        }

        if (that.rowCount <= 0) {

            if (that.navTextOffset !== null && that.navTextOffset !== undefined &&
                that.navTextOffset.length !== 0) {
                $(that.navTextOffset).text(0);
            }

            if (that.navTextLimit !== null && that.navTextLimit !== undefined &&
                that.navTextLimit.length !== 0) {
                $(that.navTextLimit).text(0);
            }
        } else {
            if (that.navTextOffset !== null && that.navTextOffset !== undefined &&
                that.navTextOffset.length !== 0) {
                var offsetDisplay = that.offset + 1;
                $(that.navTextOffset).text(offsetDisplay);
            }

            if (that.navTextLimit !== null && that.navTextLimit !== undefined &&
                that.navTextLimit.length !== 0) {

                // Hack until group permissions can be respected
                // We need a special case for when limit > actualResultSet and 
                // offset + actualResultSet < rowCount - then we need to display something else
                
                if (actualResultSetCnt < that.limit) {
                    var actualCnt = that.offset + actualResultSetCnt;
                    if (actualCnt < that.rowCount) {
                        $(that.navTextLimit).text(actualCnt);
                        return;
                    }
                }

                var limitVal = (that.offset + that.limit >= that.rowCount) ? that.rowCount : that.offset + that.limit;
                $(that.navTextLimit).text(limitVal);
            }
        }
    },

    updateNavButtons: function() {
        var that = this;
        if (that.prevBtnId !== null && that.prevBtnId !== undefined &&
            that.prevBtnId.length !== 0) {
            if (that.offset <= 0) {
                $(that.prevBtnId).prop('disabled',true);  
            } else {
                $(that.prevBtnId).prop('disabled',false);
            }
        }

        if (that.nextBtnId !== null && that.nextBtnId !== undefined &&
            that.nextBtnId.length !== 0) {
            if (that.offset + that.limit >= that.rowCount) {
                $(that.nextBtnId).prop('disabled',true);  
            } else {
                $(that.nextBtnId).prop('disabled',false);  
            }
        }
    },

    prevResults: function() {
        var that = this;

        if (that.prevBtnId === null && that.prevBtnId === undefined &&
            that.prevBtnId.length === 0) {
            return;
        }

        that.offset -= that.limit;
        if (that.offset < 0) {
            that.offset = 0;
        }

        that.updateNavButtons();

        odkCommon.setSessionVariable(that.offsetKey, that.offset);

        that.clearRows();
        that.resumeFn('prevButtonClicked');
    },

    nextResults: function() {
        var that = this;

        if (that.nextBtnId === null && that.nextBtnId === undefined &&
            that.nextBtnId.length === 0) {
            return;
        }

        that.updateNavButtons();

        if (that.offset + that.limit >= that.rowCount) {  
            return;
        }

        that.offset += that.limit;

        odkCommon.setSessionVariable(that.offsetKey, that.offset);

        that.clearRows();
        that.resumeFn('nextButtonClicked');
    },

    newLimit: function() {
        var that = this;
        var limitSelected = that.limitId + ' option:selected';
        that.limit = parseInt($(limitSelected).text());
        odkCommon.setSessionVariable(that.limitKey, that.limit);

        that.clearRows();
        that.resumeFn('limitChanged');
    },

    getSearchResults :function() {
        var that = this;
        if (that.searchTxtId === null || that.searchTxtId === undefined || 
            that.searchTxtId.length === 0) {
            return;
        }
        var searchText = $(that.searchTxtId).val();

        if (searchText !== null && searchText !== undefined &&
            searchText.length !== 0) {
            odkCommon.setSessionVariable(that.searchKey, searchText);
            searchText = '%' + searchText + '%';

            that.queryToRunParams = [];
            if (that.listQueryParams !== null && that.listQueryParams !== undefined &&
                that.listQueryParams.length > 0) {
                that.queryToRunParams = that.queryToRunParams.concat(that.listQueryParams);
            }

            var addSql = that.appendUriParamsToListQuery();
            var queryWithParams = that.listQuery + addSql;
            that.queryToRun = that.makeSearchQuery(queryWithParams);
            that.queryToRunParams = that.queryToRunParams.concat(that.getUriQueryParams());

            // Count the number of ?'s in queryToRun and 
            // append that to queryToRunParams
            var searchParamsToAdd = that.searchParams.split('?').length - 1;
            for (var i = 0; i < searchParamsToAdd; i++) {
                that.queryToRunParams.push(searchText);
            } 

            var queryToRunParts = {};
            queryToRunParts[that.queryStmt] = that.queryToRun;
            queryToRunParts[that.queryArgs] = that.queryToRunParams;
            odkCommon.setSessionVariable(that.queryKey, JSON.stringify(queryToRunParts));

            // Starting a new query - offset has to be 0
            that.offset = 0;
            odkCommon.setSessionVariable(that.offsetKey, that.offset);

            that.resumeFn('searchSelected');
        }
    },

    clearResults: function() {
        var that = this;
        if (that.searchTxtId === null || that.searchTxtId === undefined || 
            that.searchTxtId.length === 0) {
            return;
        }

        var searchText = $(that.searchTxtId).val();

        if (searchText === null || searchText === undefined ||
            searchText.length === 0) {
            odkCommon.setSessionVariable(that.searchKey, '');

            that.queryToRunParams = [];
            if (that.listQueryParams !== null && that.listQueryParams !== undefined &&
                that.listQueryParams.length > 0) {
                that.queryToRunParams = that.queryToRunParams.concat(that.listQueryParams);
            }

            var addSql = that.appendUriParamsToListQuery();
            that.queryToRun = that.listQuery + addSql;
            that.queryToRunParams = that.queryToRunParams.concat(that.getUriQueryParams());

            var queryToRunParts = {};
            queryToRunParts[that.queryStmt] = that.queryToRun;
            queryToRunParts[that.queryArgs] = that.queryToRunParams;
            odkCommon.setSessionVariable(that.queryKey, JSON.stringify(queryToRunParts));

            // Starting a new query - offset has to be 0
            that.offset = 0;
            odkCommon.setSessionVariable(that.offsetKey, that.offset);

            that.resumeFn('undoSearch');  
        }  
    }
};
})();
