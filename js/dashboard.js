angular.module('dashboard-module',[])

.service ('DashboardService', function ($q, $http) {
	var parent 	= this;

	this.get_metrics = function(date, page) {
		var deferred = $q.defer();
		if (date == undefined) { var date = ''; } else { var date = '&date=' + date; };
		if (page == undefined) { var page = ''; } else { var page = '&page=' + page; };
		var size 	= '&size=' + data_size;
		var query 	= date + page + size;
		var final_query = query.replace('&','?');

		$http({ method:'GET', url:config.metrics + final_query }).then( function (response) {
			deferred.resolve(response);
		}, function (error) {
			deferred.reject(error);
		});
		return deferred.promise;
	};
	
})

.controller ('DashboardController', function ($scope, $state, DashboardService, $stateParams, TrendsService, SessionService, $filter, DTColumnDefBuilder, DTOptionsBuilder) {

	$scope.metric_bins 		= null;
	$scope.total_items  	= null; 
    $scope.num_pages    	= null;
    $scope.limit        	= null;
    $scope.current_page 	= null;

    $scope.metrics 			= {};
    $scope.past_metrics 	= {};

    $scope.pos_change 		= false;
    
    $scope.init_page    	= $stateParams.page || 1;

	$scope.get_metrics = function(date, page) {
		var new_page = page - 1;
		DashboardService.get_metrics(date, new_page).then(function (response) {
			$scope.metrics 		= response.data.metrics;
			$scope.current_page = response.data.page + 1;
            $scope.num_pages    = response.data.pages;
            $scope.limit        = response.data.size;
            $scope.total_items  = $scope.num_pages * $scope.limit;
			for (var i = 0; i < $scope.metrics.length; i++) {
				var new_bin 		 = get_bins($scope.metrics[i].name, $scope.metric_bins);
				var new_inqueue 	 = $scope.metrics[i].inqueue;
				if ($scope.past_metrics.length == 0) {
					var received_changes = $scope.metrics[i].received - 0;
					var complete_changes = $scope.metrics[i].completed - 0;
					var inqueue_changes  = $scope.metrics[i].inqueue - 0;
				} else {
					var received_changes = $scope.metrics[i].received - $scope.past_metrics[i].received;
					var complete_changes = $scope.metrics[i].completed - $scope.past_metrics[i].completed;
					var inqueue_changes  = $scope.metrics[i].inqueue - $scope.past_metrics[i].inqueue;
				};
				
				$scope.metrics[i].received 	= get_absolute(received_changes);
				$scope.metrics[i].completed = get_absolute(complete_changes);
				$scope.metrics[i].inqueue 	= get_absolute(inqueue_changes);
				$scope.metrics[i].bin1 		= new_bin.bin1 || 0;
				$scope.metrics[i].bin2 		= new_bin.bin2 || 0;
				$scope.metrics[i].bin3 		= new_bin.bin3 || 0;

				var ok_progress = get_average(new_inqueue, $scope.metrics[i].ok ? $scope.metrics[i].ok : 0);
				var c_progress	= get_average(new_inqueue, $scope.metrics[i].caution ? $scope.metrics[i].caution : 0);
				var d_progress 	= get_average(new_inqueue, $scope.metrics[i].danger ? $scope.metrics[i].danger : 0);

				$scope.metrics[i].ok_progress 	= ok_progress;
				$scope.metrics[i].c_progress 	= c_progress;
				$scope.metrics[i].d_progress 	= d_progress;
			};
		}, function (error) {
			console.log(error);
		});
	};

	$scope.date_filter = function (date) {
		// var set_date = $filter('date')(date, 'yyyy-MM-dd');
		$state.go('user.dashboard', { date:date, page:1 });
	};	

	$scope.get_metric_bins = function () {
		TrendsService.get_metric_bins().then(function (response) {
			$scope.metric_bins = response.data;
		});
	};

	$scope.get_previous_week = function (date, page) {
		var new_page = page - 1;
		DashboardService.get_metrics(date, new_page).then( function (response) {
			$scope.past_metrics = response.data.metrics;
			$scope.get_metrics($scope.default_date, $scope.init_page);
		}, function (error) {
			console.log(error);
		});
	};

	$scope.recent_date = function () {
		DashboardService.get_metrics().then( function (response) {
			var array 	= response.data.metrics;
			var recent 	= array[0];
			console.log(recent);

			if ($stateParams.date) {
				$scope.default_date = $stateParams.date;
			} else {
				$scope.default_date = recent.date;
			};

			var p_date = new Date($scope.default_date);
			p_date.setDate(p_date.getDate()-7);
			var prev_week = previous_date(p_date);

			$scope.get_previous_week(prev_week, $scope.init_page);
		}, function (error) {
			console.log(error);
		});
	};

	$scope.view_trends = function (metric_name) {
		$state.go('user.trends', { metric:metric_name, page:1 });
	};

	$scope.page_changed = function (pages) {
        $state.go('user.dashboard', { date:$scope.default_date, page:pages });
    };

    $scope.gen_sparklines = function (dataDur, dataDate, dataAlert) {
    	sparklines(dataDur, dataDate, dataAlert);
    };

	function init () {
		SessionService.alert_messages();
		$scope.recent_date();

		var login_state = SessionService.isLoggedIn();
		if (login_state == false) {
			$state.go('login');
		};
	};

	$scope.dtOptions = DTOptionsBuilder
		.newOptions()
		.withDOM('Tft<"top"l>rt<"bottom"ip><"clear">')
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

	$scope.DTColumnDefs = [
        DTColumnDefBuilder.newColumnDef([1, 2, 3, -2, -1]).notSortable(),
        DTColumnDefBuilder.newColumnDef([4, 5, -3]).notVisible()
    ];

	$('.input-group.date').datepicker({
	    format: "yyyy-mm-dd",
	    keyboardNavigation: false,
	    forceParse: false,
	    daysOfWeekDisabled: "1,2,3,4,5,6",
	    autoclose: true
	});

	init();
	$scope.get_metric_bins();



	/*/////////////// temporary js codes ////////////////*/

	$scope.chartConfig = {
	  	options: {
	    	chart: {
	    	  	type: 'line'
	    	},
	    	plotOptions: {
	    	  	series: {
	    	    	stacking: ""
	    	  	}
	    	}
	  	},
	  	series: [{
	      	name: "Some data 2",
	      	data: [ 5, 2, 2, 3, 5 ],
	      	type: "column",
	      	id: "series-2"
	    },{
	      	name: "My Super Column",
	      	data: [ 1, 1, 2, 3, 2 ],
	      	type: "column",
	      	id: "series-3"
	    },{
	      	name: "Some data 3",
	      	data: [ 3, 1, null, 5, 2 ],
	      	connectNulls: true,
	      	id: "series-1"
	    }],
	  	title: {
	    	text: "Hello"
	  	},
	  	credits: {
	    	enabled: true
	  	},
	  	loading: false,
        size: {
            height: 250
        },
	};

	$scope.chartConfig2 = {
	  	 options: {
            chart: {
                zoomType: 'xy',
                type:'line'
            },
            rangeSelector: {
                enabled: true
            },
            navigator: {
                enabled: true
            }
        },
        series: [],
        title: {
            text: 'Hello'
        },
        size: {
            height: 250
        },
        useHighStocks: true
	}; 

	var rcvd = {"data":[[1435449600000,90],[1434844800000,75],[1434240000000,106],[1433635200000,97],[1433030400000,128],[1432425600000,109],[1431820800000,96],[1431216000000,104],[1430611200000,141],[1430006400000,187],[1429401600000,359],[1428796800000,309],[1428192000000,295],[1427587200000,268],[1426982400000,345],[1426377600000,307],[1425772800000,378],[1425168000000,274],[1424563200000,301],[1423958400000,270],[1423353600000,141],[1422748800000,281],[1422144000000,294],[1421539200000,299],[1420934400000,495],[1420329600000,635],[1419724800000,676],[1419120000000,531],[1418515200000,566],[1417910400000,579],[1417305600000,466],[1416700800000,659],[1416096000000,513],[1415491200000,400],[1414886400000,593],[1414281600000,613],[1413676800000,411],[1413072000000,722],[1412467200000,773],[1411862400000,674],[1411257600000,604],[1410652800000,539],[1410048000000,393],[1409443200000,310],[1408838400000,330],[1408233600000,303],[1407628800000,288],[1407024000000,337],[1406419200000,289],[1405814400000,339],[1405209600000,410],[1404604800000,285],[1404000000000,388],[1403395200000,326],[1402790400000,352],[1402185600000,260],[1401580800000,385],[1400976000000,302],[1400371200000,413],[1399766400000,360],[1399161600000,404],[1398556800000,330]],"id":"series-0"}
	var inq  = {"data":[[1435449600000,65],[1434844800000,62],[1434240000000,78],[1433635200000,65],[1433030400000,101],[1432425600000,79],[1431820800000,64],[1431216000000,78],[1430611200000,126],[1430006400000,161],[1429401600000,251],[1428796800000,240],[1428192000000,210],[1427587200000,243],[1426982400000,295],[1426377600000,219],[1425772800000,312],[1425168000000,244],[1424563200000,270],[1423958400000,197],[1423353600000,137],[1422748800000,191],[1422144000000,262],[1421539200000,296],[1420934400000,487],[1420329600000,429],[1419724800000,457],[1419120000000,446],[1418515200000,381],[1417910400000,502],[1417305600000,429],[1416700800000,529],[1416096000000,415],[1415491200000,305],[1414886400000,524],[1414281600000,489],[1413676800000,379],[1413072000000,538],[1412467200000,542],[1411862400000,661],[1411257600000,514],[1410652800000,439],[1410048000000,348],[1409443200000,265],[1408838400000,326],[1408233600000,267],[1407628800000,250],[1407024000000,253],[1406419200000,206],[1405814400000,237],[1405209600000,334],[1404604800000,273],[1404000000000,287],[1403395200000,256],[1402790400000,313],[1402185600000,246],[1401580800000,306],[1400976000000,261],[1400371200000,323],[1399766400000,332],[1399161600000,291],[1398556800000,264]],"id":"series-1"}
	var comp = {"data":[[1435449600000,87],[1434844800000,91],[1434240000000,93],[1433635200000,133],[1433030400000,106],[1432425600000,94],[1431820800000,110],[1431216000000,152],[1430611200000,176],[1430006400000,277],[1429401600000,348],[1428796800000,279],[1428192000000,328],[1427587200000,320],[1426982400000,269],[1426377600000,400],[1425772800000,310],[1425168000000,300],[1424563200000,228],[1423958400000,210],[1423353600000,195],[1422748800000,352],[1422144000000,328],[1421539200000,490],[1420934400000,437],[1420329600000,663],[1419724800000,665],[1419120000000,466],[1418515200000,687],[1417910400000,506],[1417305600000,566],[1416700800000,545],[1416096000000,403],[1415491200000,619],[1414886400000,558],[1414281600000,503],[1413676800000,570],[1413072000000,726],[1412467200000,892],[1411862400000,527],[1411257600000,529],[1410652800000,448],[1410048000000,310],[1409443200000,371],[1408838400000,271],[1408233600000,286],[1407628800000,291],[1407024000000,290],[1406419200000,320],[1405814400000,436],[1405209600000,349],[1404604800000,299],[1404000000000,357],[1403395200000,383],[1402790400000,285],[1402185600000,320],[1401580800000,340],[1400976000000,364],[1400371200000,422],[1399766400000,319],[1399161600000,377],[1398556800000,200]],"id":"series-2"}
	
	$scope.chartConfig2.series.push(rcvd, inq, comp);
	/*/////////////// temporary js codes ////////////////*/
})