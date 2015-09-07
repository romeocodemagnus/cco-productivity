angular.module('trends-module',[])

.service ('TrendsService', function ($q, $http) {
	var parent 	= this;

	this.get_metric_bins = function(metric_id) {
		var deferred = $q.defer();
        if (metric_id) { metric_id = '/' + metric_id; } else { metric_id = ''; };

		$http({method:'GET', url:config.metric_bins + metric_id }).then( function (response) {
			deferred.resolve(response);
		}, function (error) {
			deferred.reject(error);
		});
		return deferred.promise;
	};

    this.bin_metrics = function (metric_name, page, size) {
        var deferred = $q.defer();
        if (page != null) { page = '&page=' + page; } else { page = ''; };
        if (size != null) { size = '&size=' + size; } else { size = ''; };

        $http({ method:'GET', url:config.metrics + '?name=' + metric_name + page + size }).then( function (response) {
            deferred.resolve(response);
        }, function (error) {
            deferred.reject(error);
        });
        return deferred.promise;
    };
	
})

.controller ('TrendsController', function ($scope, $state, $stateParams, TrendsService, SessionService, DashboardService, DTOptionsBuilder, DTColumnDefBuilder) {
    $scope.metrics      = null;
    $scope.charts       = null;
    $scope.metric_bins  = null; 
    $scope.total_items  = null; 
    $scope.num_pages    = null;
    $scope.limit        = null;
    $scope.current_page = null;
    $scope.init_page    = $stateParams.page || 1;

    var received    = { data:[] };
    var inqueue     = { data:[] };
    var completed   = { data:[] };
    var ok          = { data:[] };
    var caution     = { data:[] };
    var danger      = { data:[] };

    $scope.selected_bin = $stateParams.metric || 'BAU GIFTS EDD Alerts, Cases';

    function init () {
        SessionService.alert_messages();
        
        var login_state = SessionService.isLoggedIn();
        if (login_state == false) {
            $state.go('login');
        };
    };
    
    $scope.get_metric_bins = function (){
        TrendsService.get_metric_bins().then(function (response) {
            $scope.metric_bins = response.data;
            $scope.bin_metrics($scope.init_page);
        }, function (error) {
            console.log(error);
        });
    };

    $scope.metric_charts = function () {
        TrendsService.bin_metrics($scope.selected_bin, null, data_size).then( function (response) {
            $scope.charts = response.data.metrics;
            for (var i = 0; i < $scope.charts.length; i++) {
                var r_trend  = $scope.trend_ric($scope.charts[i], 'Received');
                var i_trend  = $scope.trend_ric($scope.charts[i], 'InQueue');
                var c_trend  = $scope.trend_ric($scope.charts[i], 'Completed');
                var o_trend  = $scope.trend_ric($scope.charts[i], 'Ok');
                var ca_trend = $scope.trend_ric($scope.charts[i], 'Caution');
                var d_trend  = $scope.trend_ric($scope.charts[i], 'Danger');

                received.data.push(r_trend);
                inqueue.data.push(i_trend);
                completed.data.push(c_trend);
                ok.data.push(o_trend);
                caution.data.push(ca_trend);
                danger.data.push(d_trend);
            };
        }, function (error) {
            console.log(error);
        });
    };

    $scope.bin_metrics = function (page) {
        var new_page = page - 1;
        TrendsService.bin_metrics($scope.selected_bin, new_page, null).then( function (response) {
            $scope.metrics      = response.data.metrics;
            $scope.current_page = response.data.page + 1;
            $scope.num_pages    = response.data.pages;
            $scope.limit        = response.data.size;
            $scope.total_items  = $scope.num_pages * $scope.limit;
            for (var i = 0; i < $scope.metrics.length; i++) {
                var new_bin = get_bins($scope.metrics[i].name, $scope.metric_bins);
                $scope.metrics[i].bin1 = new_bin.bin1;
                $scope.metrics[i].bin2 = new_bin.bin2;
                $scope.metrics[i].bin3 = new_bin.bin3;

                var ok_progress = get_average($scope.metrics[i].inqueue, $scope.metrics[i].ok ? $scope.metrics[i].ok : 0);
                var c_progress  = get_average($scope.metrics[i].inqueue, $scope.metrics[i].caution ? $scope.metrics[i].caution : 0);
                var d_progress  = get_average($scope.metrics[i].inqueue, $scope.metrics[i].danger ? $scope.metrics[i].danger : 0);

                $scope.metrics[i].ok_progress   = ok_progress;
                $scope.metrics[i].c_progress    = c_progress;
                $scope.metrics[i].d_progress    = d_progress;
            };

            received.name   = 'Received';
            inqueue.name    = 'InQueue';
            completed.name  = 'Completed';
            ok.name         = $scope.metrics[0].bin1;
            caution.name    = $scope.metrics[0].bin2;
            danger.name     = $scope.metrics[0].bin3;
            
        }, function (error) {
            console.log(error);
        });
    };

    $scope.trend_ric = function (metric_bin, events) {
        var data = [];
        var final_date = Date.parse(metric_bin.date);
        data.push(final_date);
        if (events == 'Received') {
            data.push(metric_bin.received);
        } else if (events == 'InQueue') {
            data.push(metric_bin.inqueue);
        } else if (events == 'Completed') {
            data.push(metric_bin.completed);
        } else if (events == 'Ok') {
            data.push(metric_bin.ok);
        } else if (events == 'Caution') {
            data.push(metric_bin.caution);
        } else if (events == 'Danger') {
            data.push(metric_bin.danger);
        };
        return data;
    };

    $scope.select_bin = function (metric) {
        var metric_object = JSON.parse(metric);
        $state.go('user.trends', { metric:metric_object.metric, page:1 }); 
    };

    $scope.page_changed = function (pages) {
        $state.go('user.trends', { metric:$scope.selected_bin, page:pages });
    };

    $scope.select_date = function (dates) {
        $state.go('user.dashboard', { date:dates, page:1 });
    };

	$scope.chartConfig = {
        options: {
            chart: {
                zoomType: 'x'
            },
            rangeSelector: {
                enabled: false
            },
            scrollbar: {
            	enabled:false
            },
            navigator: {
                enabled: true
            },
            colors: ['#e69900', '#9c3', '#69c', '#669', '#d9534f'],
            tooltip: {
                valueSuffix: ' Cases'
            }
        },
        yAxis:{
            min: 0
        },
        series: [],
        title: {
            text: $scope.selected_bin + ': Overall Trends'
        },
        size: {
            height: 250
        },
        useHighStocks: true
    };

    $scope.chartConfig2 = {
        options: {
            chart: {
                zoomType: 'x',
                type:'area'
            },
            rangeSelector: {
                enabled: false
            },
            scrollbar: {
                enabled:false
            },
            navigator: {
                enabled: true
            },
            colors: ['#5cb85c', '#FFF000', '#d9534f'],
            tooltip: {
                valueSuffix: ' Cases'
            },
            plotOptions: {
                area: {
                    stacking: 'percent'
                },
                series: {
                    shadow: false
                }
            },
            yAxis: {
                min:0
            }
        },

        series: [],

        title: {
            text: $scope.selected_bin + ': Aging Trends'
        },
        size: {
            height: 250
        },
        useHighStocks: true
    };

    $scope.trendsDT = DTOptionsBuilder
        .newOptions()
        .withDOM('Tft<"top"l>rt<"bottom"ip><"clear">')
        .withOption('order', [0,'desc'])
        .withOption('paging', false)
        .withOption('filter', false)
        .withOption('info', false)
        .withTableTools("//cdn.datatables.net/tabletools/2.2.2/swf/copy_csv_xls_pdf.swf")
        .withTableToolsButtons([
            {
                "sExtends": "copy",
                "sButtonText": "Copy",
                "mColumns": [0,1,2,3,4,5,6,8,9]
            },
            {
                "sExtends": "csv",
                "sButtonText": "CSV",
                "mColumns": [0,1,2,3,4,5,6,8,9]
            },
            {
                "sExtends": "pdf",
                "sPdfOrientation": "landscape",
                "sButtonText": "PDF",
                "mColumns": [ 0, 1, 2, 3, 4, 5, 6, 8]
            },
            {
                "sExtends": "print",
                "sButtonText": "Print",
                "fnClick": function( button, conf ) {
                    var browser = identify_browser();
                    if (browser == 'Chrome' || browser == 'Opera') {
                        this._fnPrintStart(conf);
                        print_table(browser);
                        this._fnPrintEnd(conf);
                    } else if (browser == 'Safari' || browser == 'Firefox') {
                        print_table(browser);
                    };
                }
            }
        
        ]);

        $scope.trendsDTColumnDefs = [
            DTColumnDefBuilder.newColumnDef([1, 2, 3, -2, -1]).notSortable(),
            DTColumnDefBuilder.newColumnDef([4, 5, -3]).notVisible()
        ];

    init();
    $scope.get_metric_bins();
    $scope.chartConfig.series.push(received, inqueue, completed);
    $scope.chartConfig2.series.push(ok, caution, danger);
    $scope.metric_charts();
})