define(['opendatakit','database','jquery','underscore','moment'],
function(opendatakit,  database,  $,       _, moment) {
return {
    echo: function(str) {
        console.log("****** ECHO CALLED ******");
        alert(str);
    },
    decimalPlaces: function(num) {
        // function for counting decimals
        // https://stackoverflow.com/questions/10454518/javascript-how-to-retrieve-the-number-of-decimals-of-a-string-number
        var match = (''+num).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
        if (!match) { return 0; }
        return Math.max(
            0,
            // Number of digits right of decimal point.
            (match[1] ? match[1].length : 0)
            // Adjust for scientific notation.
            - (match[2] ? +match[2] : 0));
    },
    studyNumber: function(letters,zeros,num) {
        var number = Number(num) + "";
        while (number.length < zeros) {
            number = "0" + number;
        };
        return letters + "-" + number;
    },
    randomLabel: function(sex,random1,random2) {
        random1 = Number(random1);
        random2 = Number(random2);
        if (sex == 1) {
            sex = "M";
        } else {
            sex = "F";
        }
        return label = sex + "_" + random1 + "-" + random2;
    },
    characters: function(string) {
        var str = string;
        if (str == null) {
            return 0;
        } else {
            return str.length;
        }
    },
    relation: function(relation,language) {
        var rela;
        if (relation == '1') {
            if (language == 'EN') {
                rela = 'Mother';
            } else {
                rela = 'Mãe';
            }
        } else if (relation == '2') {
            if (language == 'EN') {
                rela = 'Father';
            } else {
                rela = 'Pai';
            }
        } else if (relation == null) {
            if (language == 'EN') {
                rela = "Don't know"; 
            } else {
                rela = "Não sabe"
            }
        } else {
            rela = relation;
        }
        return rela;
    }
}
});