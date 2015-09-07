angular.module('dataentry-module',[])

.service ('DataEntryService', function ($q, $http) {

	this.add_metric = function (data) {
		var deferred = $q.defer();
		var json_data = angular.toJson(data);

		$http({ method:'POST', url:config.metrics, data:json_data, headers:{ "Content-Type":"application/json" } }).then( function (response) {
			deferred.resolve(response);
		}, function (error) {
			deferred.reject(error);
		});
		return deferred.promise;
	};

	this.upload_file = function (file) {
		var deferred = $q.defer();

		$http({ method:'POST', url:config.upload_file, file:file, headers: { 'Content-Type':'multipart/form-data' }, 
			transformRequest:angular.identity }).then( function (response) {
			deferred.resolve(response);
		}, function (error) {
			deferred.reject(error);
		});
		return deferred.promise;
	};

 })

.controller ('DataEntryController', function ($scope, $state, $filter, TrendsService, DataEntryService, SessionService, SettingsService) {

	$scope.user 			= null;
	$scope.default_metric 	= null;
	$scope.bin1 			= null;
	$scope.bin2				= null;
	$scope.bin3				= null;
	$scope.metric_bins 		= null;

	$scope.show_bin1 		= true;
	$scope.show_bin2		= true;
	$scope.show_bin3		= true;

	$scope.success_alert 	= false;
	$scope.failed_alert 	= false;
	$scope.success_upload 	= false;

	$scope.metric 			= {};

	function init () {
		SessionService.alert_messages();

		$scope.user = SessionService.get_user_data();
		var login_state = SessionService.isLoggedIn();
		if (login_state == false) {
			$state.go('login');
		};
	};

	$scope.get_metric_bins = function () {
		TrendsService.get_metric_bins().then(function (response) {
			$scope.metric_bins = response.data;
			$scope.default_metric 	= $scope.metric_bins[0];
			$scope.bin1 			= $scope.default_metric.bin1;
			$scope.bin2				= $scope.default_metric.bin2;
			$scope.bin3				= $scope.default_metric.bin3;
		}, function (error) {
			console.log(error);
		});
	};

	$scope.add_metric = function (data) {
		data.name 	 = $scope.default_metric.metric;
		data.ok 	 = data.ok 		|| 0;
		data.caution = data.caution || 0;
		data.danger  = data.danger 	|| 0;
		actions 	 = 'Submit Manual Data';

		DataEntryService.add_metric(data).then( function (response) {
			$scope.metric = {};
			$scope.show_popup();

			details = actions + ': ' + data.name + ', Date: ' + data.date;
			log = set_log($scope.user, details, actions, 'Success');
			SessionService.logs(log);
		}, function (error) {

			details = actions + ': ' + data.name;
			log = set_log($scope.user, details, actions, 'Failure');
			SessionService.logs(log);
		});
	};

	$scope.selected_bin = function (bin) {
		var json_bin = JSON.parse(bin);
		
		$scope.default_metric 	= json_bin;
		$scope.bin1 			= json_bin.bin1;
		$scope.bin2				= json_bin.bin2;
		$scope.bin3				= json_bin.bin3;

		if ($scope.bin1 == "") {
			console.log('in');
			$scope.show_bin1 = false;
			$scope.show_bin2 = true;
			$scope.show_bin3 = true;
		} else if ($scope.bin2 == "") {
			$scope.show_bin1 = true;
			$scope.show_bin2 = false;
			$scope.show_bin3 = true;
		} else if ($scope.bin3 == "") {
			$scope.show_bin1 = true;
			$scope.show_bin2 = true;
			$scope.show_bin3 = false;
		} else {
			$scope.show_bin1 = true;
			$scope.show_bin2 = true;
			$scope.show_bin3 = true;
		}
	};

	$scope.log_activity = function (data) {
		SessionService.logs(data).then( function (response) {
			
		}, function (error) {
			console.log(error);
		});
	};

	$scope.upload_file = function () {
		var file = $('#file');
		if (file) {
			console.log(file);
			// var formData = new FormData();
			// 	formData.append('file', file[0].files[0]);
			// DataEntryService.upload_file(formData).then( function (response) {
			// 	console.log(response);
			// }, function (error) {
			// 	console.log(error);
			// });
		} else {
			return;
		};
	};

	$scope.show_popup = function () {
        $("#success-alert").alert();
        $("#success-alert").fadeTo(3000, 500).slideUp(500, function(){
       		$("#success-alert").hide();
        }); 
	};

	$('.input-group.date').datepicker({
	    format: "yyyy-mm-dd",
	    keyboardNavigation: false,
	    forceParse: false,
	    daysOfWeekDisabled: "1,2,3,4,5,6",
	    autoclose: true
	});

	init();
	$scope.get_metric_bins();
	
})