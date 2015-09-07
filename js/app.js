var dependencies = [
'ui.router',
'ui.bootstrap',

'ngResource',

'dashboard-module',
'dataentry-module',
'trends-module',
'login-module',
'nav-module',
'settings-module',
'highcharts-ng',
'angular-loading-bar',
'ngCookies',
'pascalprecht.translate',

'datatables',
'datatables.bootstrap',
'datatables.tabletools',
'datatables.colvis',
];

angular.module('app',dependencies)

.filter('decodeURIComponent', function() {
	return window.decodeURIComponent;
})

.config( function ($translateProvider) {
	$translateProvider.translations('ja', translations('ja'))
	$translateProvider.translations('en', translations('en'))
})

//defines the routes on our website
.config(function($stateProvider, $urlRouterProvider){
	
	//default route
	$urlRouterProvider.otherwise("/user/dashboard");

	// provides the different routes.
	$stateProvider

	.state('user', {
		url 			: '/user',
		templateUrl 	: 'views/navbar.html',
		controller 		: 'NavController',
		controllerAs	: 'navCtrl'
	})

		.state('user.dashboard', {
			url 			: '/dashboard?date&page',
			templateUrl 	: 'views/dashboard.html',
			controller 		: 'DashboardController',
			controllerAs	: 'dashboardCtrl'
		})

		.state('user.trends', {
			url 			: '/trends?metric&page',
			templateUrl 	: 'views/trends.html',
			controller 		: 'TrendsController',
			controllerAs	: 'trendsCtrl'
		})

		.state('user.dataentry', {
			url 			: '/dataentry',
			templateUrl 	: 'views/dataentry.html',
			controller 		: 'DataEntryController',
			controllerAs	: 'dataentryCtrl'
		})

		.state('user.settings', {
			url 			: '/settings?metric',
			templateUrl 	: 'views/settings.html',
			controller 		: 'SettingsController',
			controllerAs	: 'settingsCtrl'
		})

	.state('login', {
		url 			: '/login',
		templateUrl 	: 'views/login.html',
		controller 		: 'LoginController',
		controllerAs	: 'loginCtrl'
	})
})

.directive('numbersOnly', function () {
    
    return {
        require: 'ngModel',
        link: function(scope, element, attrs, modelCtrl) {
            modelCtrl.$parsers.push(function (inputValue) {
                if (inputValue == undefined) return '' 
                    var transformedInput = inputValue.replace(/[^0-9]/g, ''); 
                if (transformedInput!=inputValue) {
                    modelCtrl.$setViewValue(transformedInput);
                    modelCtrl.$render();
                }         
               return transformedInput;         
            });
        }
    };

})

.filter('reverse', function() {
	return function(items) {
	    return items.slice().reverse();
	};
})