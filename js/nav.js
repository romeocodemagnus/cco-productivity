angular.module('nav-module', [])

.controller('NavController', function ($scope, $state, $cookieStore, $translate, SessionService) {
	$translate.use('en');
	$scope.user = 'User';

	function init () {
		$scope.currState = $state;
		var state = null;
    	$scope.$watch('currState.current.name', function(newValue, oldValue) {
			if (newValue == 'user.dashboard') {
				state = newValue;
				$scope.active = 1;	
			} else if (newValue == 'user.trends') {
				state = newValue;
				$scope.active = 2;	
			} else if (newValue == 'user.dataentry') {
				state = newValue;
				$scope.active = 3;
			};
   	 	});
   	 	
   	 	if (state) {
			$scope.selected_view($scope.active, newValue);
   	 	};

   	 	if (SessionService.isLoggedIn()) {
   	 		$scope.user = SessionService.get_user_data()
   	 	};
	};

	$scope.logout_user = function() {
		$cookieStore.remove('user');
        $state.go('login');
	};

	$scope.view_settings = function () {
		$state.go('user.settings');
	};

	$scope.selected_view = function (value, view) {
		$scope.active = value;
		$state.go(view);
	};

	init();
})