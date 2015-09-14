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

	/*/////////////// temporary js codes ////////////////*/
})