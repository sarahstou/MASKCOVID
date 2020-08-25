define(['database','opendatakit','controller','backbone','moment','formulaFunctions','handlebars','promptTypes','jquery','underscore','d3','handlebarsHelpers','combodate'],
function(database,  opendatakit,  controller,  Backbone,  moment,  formulaFunctions,  Handlebars,  promptTypes,  $,       _,           d3,   _hh) {
// custom functions are placed under 'window' to be visible in calculates...
// note that you need to be careful about naming -- should probably go somewhere else?
window.is_finalized = function() {
    return ('COMPLETE' === database.getInstanceMetaDataValue('_savepoint_type'));
};

function elog(obj) {
    var prefix = "**BHP**";
    console.error(prefix, obj);
    return;
}

var adate = promptTypes.input_type.extend({
    type: "adate",
    asDate: null,
    unknownDay: false,
    unknownMonth: false,
    unknownYear: false,
    templatePath: '../config/assets/templates/adate.handlebars',
    
    events: {
        "change select": "modification",
        "swipeleft .input-container": "stopPropagation",
        "swiperight .input-container": "stopPropagation",
        "focusout .input-container": "loseFocus",
        "focusin .input-container": "gainFocus"        
    },

    configureRenderContext: function(ctxt) {
        var that = this;
        var renderContext = that.renderContext;
        //elog(renderContext);
        var startYear = 1900;
        if (renderContext.display.adate && renderContext.display.adate.fromYear) {
            startYear = parseInt(renderContext.display.adate.fromYear, 10);
        }
        var endYear = new Date().getYear()+1900;
        if (renderContext.display.adate && renderContext.display.adate.toYear) {
            if (renderContext.display.adate.toYear == "nextYear") {
                endYear = endYear+1;
            }
            else {
                endYear = parseInt(renderContext.display.adate.toYear, 10);
            }
        }
        var dontknowLabel = "NS";
        renderContext.dayLabel = "dia";
        renderContext.monthLabel = "mes";
        renderContext.yearLabel = "ano";
        
        var days = Array.apply(null, {length: 32}).map(Number.call, Number).slice(1);
        days.unshift(dontknowLabel);
        days.unshift("");
        renderContext.days = days;
        
        var months = Array.apply(null, {length: 13}).map(Number.call, Number).slice(1);
        months.unshift(dontknowLabel);
        months.unshift("");
        renderContext.months = months;
        
        var years = [];
        for (var i = endYear; i >= startYear; i--) { years.push(i); }
        years.unshift(dontknowLabel);
        years.unshift("");
        renderContext.years = years;
        
        ctxt.success();
      
    },
    sameValue: function(ref, value) {
        return ref.valueOf() == value.valueOf();
    },
    validateValue: function() {
        elog("validateValue called upon");
        return true; //TODO
    },
    afterRender: function() {
        elog("After render called upon");
        var that = this;
        var thatValue = that.getValue();
        if (thatValue) {
            that.setSelects(thatValue);
        }
    },
    beforeMove: function() {
        var that = this;
        return null;
        // var input = !that.validateValue()
        // // check validity with html form data validation to block screen move
        // var isInvalid = (input.validity && !input.validity.valid) || that.setValueAndValidate(input.value);
        // if ( isInvalid ) {
        //     return { message: that.display.invalid_value_message };
        // } else {
        //     return null;
        // }
    },
    // generateSaveValue: function(jsonFormSerialization) {
    //     elog("generateSaveValue called upon");
    //     var that = this;
    //     if(jsonFormSerialization){
    //         return "habba";
    //     }
    //     return null;
    // },
    // parseSaveValue: function(savedValue) {
    //     elog("parseSaveValue called upon");
    // },
    updateDateProps: function(d,m,y) {
        
        that = this;
        var renderContext = that.renderContext;
        if (d=="" || m=="" || y=="") {
            that.asDate = null;
            that.$('.adate-ageInYears').text("")
            that.unknownDay = true;
            that.unknownMonth = true;
            that.unknownYear = true;
        } else {
            that.asDate = new Date(y=="NS"?1900:y,m=="NS"?5:m-1,d=="NS"?15:d);            
            that.unknownDay = d == "NS";
            that.unknownMonth = m == "NS";
            that.unknownYear = y == "NS";
            
            var d = moment(that.asDate);
            if (!d.isValid() || that.unknownYear) {
                that.$('.adate-ageInYears').text()
                return;
            }
            
            // also update help text
            var yD = moment().diff(d,"years");
            d.add(yD,"years");
            var mD = moment().diff(d,"months");
            d.add(mD,"months");
            var dD = moment().diff(d,"days");
            var txt = "";
            
            if (yD!=0) {
                if (that.unknownMonth || that.unknownDay) {
                    txt += "~";
                }
                txt += yD + " anos, ";
            }  
            if (yD!=0 || mD!=0) {
                txt += mD + " meses e ";
            }
            if (yD!=0 || mD!=0 || dD!=0) {
                txt += dD + " dias.";
            }     
            if (renderContext.display.adate && renderContext.display.adate.helperText == false) {
                that.$('.adate-ageInYears').text("");
            } else {
                that.$('.adate-ageInYears').text(txt);
            }       
            
        }
    },
    setSelects : function(strValue) {
        var that = this;
        // Updates the select boxes
        var d = "";
        var m = "";
        var y = "";
        if (strValue) {
            var dmy = strValue.split(",");
            elog(dmy);
            if (dmy.length === 3) {
                d = dmy[0].split(":")[1];
                m = dmy[1].split(":")[1];
                y = dmy[2].split(":")[1];
                that.updateDateProps(d,m,y);
            }
        } 
        elog("DAY:");
        elog(that.$('.adate-dayselect').length);
        elog($("#daypicker--isurvey0").find("option").length);
        that.$('.adate-dayselect').val(d);
        that.$('.adate-monthselect').val(m);
        that.$('.adate-yearselect').val(y);
    },
    modification: function(evt) {
        elog("MODIFICATION TRIGGERED!");
        var that = this;
        odkCommon.log('D',"prompts." + that.type + ".modification px: " + that.promptIdx);
        
        var newValue = null;
        var d = that.$('.adate-dayselect').val();
        var m = that.$('.adate-monthselect').val();
        var y = that.$('.adate-yearselect').val();
        newValue = "D:"+d+",M:"+m+",Y:"+y;
        that.updateDateProps(d,m,y);        
        elog(newValue);
        
        
        var ctxt = that.controller.newContext(evt, that.type + ".modification");
        that.controller.enqueueTriggeringContext($.extend({},ctxt,{success:function() {
            odkCommon.log('D',"prompts." + that.type + ".modification: determine if reRendering ", "px: " + that.promptIdx);
            var ref = that.getValue();
            elog("Getvalue ref:");
            elog(ref);
            if ( ref === null || ref === undefined ) {
                rerender = ( newValue !== null && newValue !== undefined );
            } else if ( newValue === null || newValue === undefined ) {
                rerender = ( ref !== null && ref !== undefined );
            } else {
                rerender = !(that.sameValue(ref, newValue));
            }

            var renderContext = that.renderContext;
            if ( newValue === undefined || newValue === null ) {
                renderContext.value = '';
            } else {
                renderContext.value = newValue;
            }

            // track original value
            var originalValue = ref;
            elog("Setting value to: " + newValue);
            //that.setValueDeferredChange(newValue);
            that.setValueAndValidate(newValue);
            renderContext.invalid = !that.validateValue();
            if ( renderContext.invalid ) {
                newValue = originalValue;
                //that.setValueDeferredChange(originalValue);
                that.setValueAndValidate(originalValue);
            }

            // We are now done with this
            ctxt.success();
        },
        failure:function(m) {
            ctxt.log('D',"prompts." + that.type + ".modification -- prior event terminated with an error -- aborting!", "px: " + that.promptIdx);
            ctxt.failure(m);
        }}));
        
    },
    getValue: function() {
        if (!this.name) {
            console.error("prompts.adate.getValue: Cannot get value of prompt with no name. px: " + this.promptIdx);
            throw new Error("Cannot get value of prompt with no name.");
        }
        var value = database.getDataValue(this.name);
        elog("DBVALUE:");
        elog(value);
        if (value === null || value === undefined) {
          return null;
        }
        
        return value;
    }
});

var custom_date = promptTypes.datetime.extend({
    type: "date",
    showTime: false,
    timeTemplate: "DD / MM / YYYY"
});

var async_assign = promptTypes.base.extend({
    type: "async_assign",
    debug: false,
    valid: true,
    templatePath: '../config/tables/MIF/forms/MIF/templates/async_assign.handlebars',
    _cachedSelection: null,
    getLinkedTableId: function() {
        var queryDefn = opendatakit.getQueriesDefinition(this.values_list);
        if ( queryDefn != null )
        {
            if ( queryDefn.linked_table_id == null ) {
                return queryDefn.linked_form_id;
            } else {
                return queryDefn.linked_table_id;
            }
        } else {
            odkCommon.log('E',"query definiton is null for " + this.type + " in getLinkedTableId");
            return null;
        }
    },
    getLinkedFormId: function() {
        var queryDefn = opendatakit.getQueriesDefinition(this.values_list);
        if ( queryDefn != null )
        {
            return queryDefn.linked_form_id;
        } else {
            odkCommon.log('E',"query definiton is null for " + this.type + " in getLinkedFormId");
            return null;
        }
    },
    getLinkedFieldName: function() {
        var queryDefn = opendatakit.getQueriesDefinition(this.values_list);
        if ( queryDefn != null )
        {
            return queryDefn.fieldName;
        } else {
            odkCommon.log('E',"query definiton is null for " + this.type + " in getLinkedFieldName");
            return null;
        }
    },
    getFormPath: function() {
        if ( this.getLinkedFormId() === "framework" ) {
            return '../config/assets/framework/forms/framework/';
        } else {
            return '../config/tables/' + this.getLinkedTableId() + '/forms/' + this.getLinkedFormId() + '/';
        }
    },
    convertSelection: function(linkedMdl) {
        var queryDefn = opendatakit.getQueriesDefinition(this.values_list);
        var that = this;
        if ( queryDefn.selection == null || queryDefn.selection.length === 0 ) {
            return null;
        }
        if ( that._cachedSelection != null ) {
            return that._cachedSelection;
        }
        that._cachedSelection = database.convertSelectionString(linkedMdl, queryDefn.selection);
        return that._cachedSelection;
    },
    _linkedCachedMdl: null,
    _linkedCachedInstanceName: null,
    getLinkedInstanceName: function() {
        return this._linkedCachedInstanceName;
    },
    getLinkedMdl: function(ctxt) {
        var that = this;
        if ( that._linkedCachedMdl != null ) {
            ctxt.success(that._linkedCachedMdl);
            return;
        }
        var filePath = that.getFormPath() + 'formDef.json';
        opendatakit.readFormDefFile($.extend({},ctxt,{success:function(formDef) {
             var ino = opendatakit.getSettingObject(formDef, 'instance_name');
             if ( ino !== null ) {
                that._linkedCachedInstanceName = ino.value;
            } else {
                that._linkedCachedInstanceName = null;
            }
            database.readTableDefinition($.extend({}, ctxt, {success:function(tlo) {
                ctxt.log('D',"prompts." + that.type +
                    'getLinkedMdl.readTableDefinition.success', "px: " + that.promptIdx );
                that._linkedCachedMdl = tlo;
                ctxt.success(tlo);
            }}), formDef, that.getLinkedTableId(), filePath);
        }}), filePath );
    },
    choice_filter: function(){ return true; },
    configureRenderContext: function(ctxt) {
        var that = this;
        var queryDefn = opendatakit.getQueriesDefinition(this.values_list);
        ctxt.log('D',"prompts." + that.type + ".configureRenderContext", "px: " + that.promptIdx);
        that.getLinkedMdl($.extend({},ctxt,{success:function(linkedMdl) {
            var dbTableName = linkedMdl.table_id;
            var selString = that.convertSelection(linkedMdl);
            var selArgs = queryDefn.selectionArgs();
            var displayElementName = that.getLinkedFieldName();
            ctxt.log('D',"prompts." + that.type + ".configureRenderContext.before.get_linked_instances", "px: " + that.promptIdx);
            database.get_linked_instances($.extend({},ctxt,{success:function(instanceList) {
                ctxt.log('D',"prompts." + that.type + ".configureRenderContext.success.get_linked_instances", "px: " + that.promptIdx);
                var filteredInstanceList = _.filter(instanceList, function(instance) {
                    return that.choice_filter(instance);
                });
                instanceList = filteredInstanceList;
                // get the value we are aggregating
                var valueList = _.map(instanceList, function(instance) {
                    return instance['display_field'];
                    });
                // discard any nulls or undefineds
                valueList = _.filter(valueList, function(value) {
                    return value !== null && value !== undefined;
                });

                var aggValue;
                if ( valueList.length === 0 ) {
                    // set aggValue to null
                    aggValue = null;
                    if ( that.type === "async_assign_total" ) {
                        aggValue = 0.0;
                    } else if ( that.type === "async_assign_count" ) {
                        aggValue = 0;
                    }
                } else {
                    if ( that.type === "async_assign_max" ) {
                        aggValue = _.max(valueList);
                    } else if ( that.type === "async_assign_min" ) {
                        aggValue = _.min(valueList);
                    } else if ( that.type === "async_assign_avg" ) {
                        var sum = _.reduce(valueList, function(memo, value) { return memo + value; }, 0.0);
                        aggValue = sum / valueList.length;
                    } else if ( that.type === "async_assign_sum"  || that.type === "async_assign_total" ) {
                        var sum = _.reduce(valueList, function(memo, value) { return memo + value; }, 0.0);
                        aggValue = sum;
                    } else if ( that.type === "async_assign_count" ) {
                        aggValue = valueList.length;
} else if (that.type === "async_assign_num_value" || that.type === "async_assign_text_value" || that.type === "async_assign_date") {
                        aggValue = _.last(valueList);
                    } else {
                        ctxt.log('E',"prompts." + that.type + ".configureRenderContext.unrecognizedPromptType", "px: " + that.promptIdx);
                        aggValue = null;
                    }
                }

                that.setValueDeferredChange(aggValue);
                that.renderContext.type = that.type;
                that.renderContext.valueList = JSON.stringify(valueList);
                that.renderContext.aggValue = (aggValue === null) ? "null" : ((aggValue === undefined) ? "undefined" : aggValue);

                ctxt.log('D',"prompts." + that.type + ".configureRenderContext.success.get_linked_instances.success", "px: " + that.promptIdx + " instanceList: " + instanceList.length);
                ctxt.success();
            }}), dbTableName, selString, selArgs, displayElementName, null);
        }}));
    }
});
return {
	"adate" : adate,
	"async_assign" : async_assign,
	"custom_date" : custom_date,
	"async_assign_num_value" : async_assign.extend({
	    type: "async_assign_num_value",
		datatype: "number"
	}),
	"async_assign_text_value" : async_assign.extend({
	    type: "async_assign_text_value",
		datatype: "string"
	}),
	"async_assign_max" : async_assign.extend({
	    type: "async_assign_max",
	    datatype: "number"
	}),
	"async_assign_min" : async_assign.extend({
	    type: "async_assign_min",
	    datatype: "number"
	}),
	"async_assign_avg" : async_assign.extend({
	    type: "async_assign_avg",
	    datatype: "number"
	}),
	"async_assign_sum" : async_assign.extend({
	    type: "async_assign_sum",
	    datatype: "number"
	}),
	"async_assign_total" : async_assign.extend({
	    type: "async_assign_total",
	    datatype: "number"
	}),
	"async_assign_count" : async_assign.extend({
	    type: "async_assign_count",
	    datatype: "integer"
	}),
	"async_assign_date" : async_assign.extend({
	    type: "async_assign_date",
	    datatype: "date"
	})
	}});