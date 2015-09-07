var details     = null;
var log         = null;
var actions     = null;

var data_size   = 9999999;

var previous_date = function (date) {

    var current_day = new Date(date); 
    var day         = current_day.getDate() - current_day.getDay(); 
    var sunday      = new Date(current_day.setDate(day)).toUTCString(); 

    var date        = new Date(sunday);
    var yyyy        = date.getFullYear().toString();
    var mm          = (date.getMonth()+1).toString(); 
    var dd          = date.getDate().toString();
    var new_date    = yyyy + '-' + (mm[1]?mm:"0"+mm[0]) + '-' + (dd[1]?dd:"0"+dd[0]);

    return new_date;
};

var get_bins = function (metric, metric_bins) {
	for (var i = 0; i < metric_bins.length; i++) {
		if (metric_bins[i].metric == metric) {
			return metric_bins[i];
		};
	};
};

var get_average = function (sum, value) {
	var set_average = value/sum;
	final_value 	= set_average * 100;
	return final_value;
};

var sort_dates = function (date, date_array) {
    if (date_array.length == 0) {
        return date;
    } else {
        for (var i = 0; i < date_array.length; i++) {
            if (date != date_array[i]) {
                return date;
            } else {
            	// do nothing
            }
        };
    }
};

var set_log = function (user, details, action, status) {
    var full_name = user.firstName + ' ' + user.lastName;

    this.activity_log  = {
        actor       : full_name,
        activity    : action,
        result      : status,
        details     : details
    };
    return this.activity_log;
};

var print_table = function (browser_type) {
    if (browser_type == 'Firefox' || browser_type == 'Safari') {
        var win = window.open('');
        javascript:win.document.write('<html><head><title>Print</title>');
        javascript:win.document.write('<link rel="stylesheet" type="text/css" href="../bower_components/bootstrap/bootstrap.min.css" >');
        javascript:win.document.write('<link rel="stylesheet" type="text/css" href="../custom/datepicker/bootstrap-datepicker.css" >');
        javascript:win.document.write('<link rel="stylesheet" type="text/css" href="../bower_components/datatables/media/css/dataTables.tableTools.css" >' );
        javascript:win.document.write('<link rel="stylesheet" type="text/css" href="../bower_components/angular-loading-bar/build/loading-bar.css" >');
        javascript:win.document.write('<link rel="stylesheet" type="text/css" href="../custom/fileupload/bootstrap-fileupload.css" >');
        javascript:win.document.write('<link rel="stylesheet" type="text/css" href="../css/App.css" >');
        javascript:win.document.write('<link rel="stylesheet" type="text/css" href="../css/App.Overrides.css" >');
        javascript:win.document.write('<link rel="stylesheet" type="text/css" href="../css/custom.css" >');
        javascript:win.document.write('<link rel="stylesheet" type="text/css" href="../font-awesome/css/font-awesome.min.css" >');
        javascript:win.document.write('<script src="../bower_components/bootstrap/jquery.js"></script>');
        javascript:win.document.write('<script src="../bower_components/angular/angular.js">');
        javascript:win.document.write('<script src="../custom/sparkline/jquery.sparkline.min.js"></script>');
        javascript:win.document.write('<script src="../js/utils.js"></script>');
        javascript:win.document.write('<script src="../js/dashboard.js"></script>');
        javascript:win.document.write('<script src="../js/app.js"></script></head><body>');
        javascript:win.document.write($("#div_table").html());
        javascript:win.document.write('</body></html>');
        javascript:win.document.close();
        javascript:win.focus();
        javascript:win.print();
        javascript:win.close();

    } else if (browser_type == 'Chrome' || browser_type == 'Opera') {
        window.print(); 
    } else {
        window.print();
    }
};

var identify_browser = function () {
    var browser_type = null;

    var isOpera      = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
    var isFirefox    = typeof InstallTrigger !== 'undefined';
    var isSafari     = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
    var isChrome     = !!window.chrome && !isOpera;
    var isIE         = false || !!document.documentMode; 

    if (isOpera)    { browser_type = 'Opera' };
    if (isFirefox)  { browser_type = 'Firefox' };
    if (isSafari)   { browser_type = 'Safari' };
    if (isChrome)   { browser_type = 'Chrome' };
    if (isIE)       { browser_type = 'Explorer' };

    return browser_type;
}

var get_absolute = function (value) {
    var data = {};

    data.result = Math.abs(value);

    /////////////// static
    data.temp_dur   = [48,10,26,45,30,40,25,38,43,48,20,43];
    data.temp_date  = [1381501200,1381509900,1381565100,1384254900,1384270200,1384938480,1385481660,1385539980,1385546520,1385558520,1385573100,1385733660];
    data.temp_alert = [12345,23456,34567,45678,56789,67890,78901,89012,90123,12890,23904,36757];
    /////////////// static

    if (value == 0) {
        data.state = null;
    } else if (value < 0) {
        data.state = false;
    } else {
        data.state = true;
    };

    return data;
};

var sparklines = function (dataDur, dataDate, dataAlert) {

    $('.trend-line').sparkline(dataAlert, {
        disableHiddenCheck: true,
        height: '25px',
        width: '100px',
        chartRangeMin: 0,
        chartRangeMax: 50,
        defaultPixelsPerValue: 25,
        numberDigitGroupSep: null,
        tooltipFormat: '<div style="text-align: center; padding-bottom: 3px; border-bottom: 1px solid #ccc; margin-bottom: 3px;"><strong>Alert {{y}}</div>',
        lineColor: 'transparent',
        fillColor: false,
        spotColor: false,
        minSpotColor: false,
        maxSpotColor: false,
        highlightSpotColor: false,
        highlightLineColor: false,
        tooltipOffsetX: -50,
        tooltipOffsetY: 25
    });

    $('.trend-line').sparkline(dataDate, {
        composite: true,
        disableHiddenCheck: true,
        height: '25px',
        width: '100px',
        chartRangeMin: 0,
        chartRangeMax: 50,
        defaultPixelsPerValue: 25,
        tooltipFormatter: function (sparkline, options, fields) {
            var date = new Date(0);
            date.setUTCSeconds(fields.y);
            var month = (date.getMonth() + 1),
            day = date.getDate(),
            year = date.getFullYear(),
            hours = date.getHours(),
            minutes = date.getMinutes();
            var formattedDate = month + '/' + day + '/' + year;
            var formattedTime = function() {
                var formattedHours = function() {
                    if (hours == 0) hours = '12';
                    else if (hours > 12) hours = (hours - 12);
                    return hours;
                }
                var formattedMinutes = function() {
                    if (minutes < 10) minutes = '0' + minutes;
                    return minutes;
                }
                var time = formattedHours() + ':' + formattedMinutes() + ' ' + ((date.getHours() < 12)? 'AM' : 'PM');
                return time;
            }
            return '<div style="text-align: center; padding-bottom: 3px; border-bottom: 1px solid #ccc; margin-bottom: 3px;">' + formattedDate + '<br/>Start time: ' + formattedTime() + '</div>';
        },
        lineColor: 'transparent',
        fillColor: false,
        spotColor: false,
        minSpotColor: false,
        maxSpotColor: false,
        highlightSpotColor: false,
        highlightLineColor: false
    });

    $('.trend-line').sparkline(dataDur, {
        type: 'line',
        composite: true,
        disableHiddenCheck: true,
        height: '25px',
        width: '100px',
        chartRangeMin: 0,
        chartRangeMax: 50,
        defaultPixelsPerValue: 25,
        tooltipFormat: '{{y}} min. triage time',
        lineColor: '#444444',
        fillColor: 'transparent',
        spotColor: '#e5412d',
        minSpotColor: '#e5412d',
        maxSpotColor: '#e5412d',
        highlightSpotColor: '#ff5b3f',
        highlightLineColor: '#ff5b3f'
    });

};