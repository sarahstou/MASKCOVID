define(['opendatakit','database','jquery','underscore','moment'],
function(opendatakit,  database,  $,       _, moment) {
return {
    getMoment: function(aDate) {
        if (!aDate || aDate.length<4 || this.yearUnknown(aDate)) {
            return false;
        }
        aDate = aDate.toUpperCase().replace('D:NS','D:15').replace('M:NS','M:7').replace('M:NS','D:1'); // unknown date: 15th of month, unknown month: july 1st
        var d = moment(aDate, '\\D:DD,\\M:MM,\\Y:YYYY');
        if (d.isValid()) {
            return d;
        }
        return false;
    },
    hasUncertainty: function(aDate) {
        return !aDate || aDate.toUpperCase().indexOf('NS')>-1;   
    },
    yearUnknown: function(aDate) {
        return !aDate || aDate.toUpperCase().indexOf('Y:NS')>-1;
    },
    monthUnknown: function(aDate) {
        return !aDate || aDate.toUpperCase().indexOf('M:NS')>-1;   
    },
    dayUnknown: function(aDate) {
        return !aDate || aDate.toUpperCase().indexOf('D:NS')>-1;
    },
    ageIn: function(aDate, strUnit) {
        var a = this.getMoment(aDate);
        if (!a) {
            return -9999;
        }
        return moment().diff(a,strUnit);
    },
    ageInYears: function(aDate) {        
        return this.ageIn(aDate, 'years');
    },
    ageInMonths: function(aDate) {
        return this.ageIn(aDate, 'months');
    },
    ageInDays: function(aDate) {
        return this.ageIn(aDate, 'days');
    },
    diffInYears: function(aDateA, aDateB) {
        var a = this.getMoment(aDateA);
        var b = this.getMoment(aDateB);
        if (!a || !b) {
            return -9999;
        }
        return b.diff(a,'years');
    },
    diffInDays: function(aDateA,aDateB) {
        var a = this.getMoment(aDateA);
        var b = this.getMoment(aDateB);
        if (!a || !b) {
            return -9999;
        }
        return b.diff(a,'days');
    },
    display: function(aDate) {
        var a = this.getMoment(aDate);
        var d;
        if (this.hasUncertainty(aDate)) {
            if (this.dayUnknown(aDate)) {
                if (this.monthUnknown(aDate)) {
                    d = moment(a).format('??/??/YYYY');
                } else {
                    d = moment(a).format('??/MM/YYYY');
                }   
            } 
            else if (this.monthUnknown(aDate)) {
                d = moment(a).format('DD/??/YYYY'); 
            }
        } else {
            d = moment(a).format('DD/MM/YYYY');
        }
        return d;
    },
    today: function() {
        var today = new Date();
        var day = today.getDate();
        var mon = today.getMonth()+1;
        var yea = today.getFullYear();
        var aDate = 'D:' + day + ',M:' + mon + ',Y:' + yea;
        return aDate;
    },
    hoursMinutes: function(date) {
        var d = new Date(date);
        var h = ("0" + d.getHours()).slice(-2);
        var m = ("0" + d.getMinutes()).slice(-2);
        var hourMin = h + ":" + m;
        return hourMin;
    }
}
});