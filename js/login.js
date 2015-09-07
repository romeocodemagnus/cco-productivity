angular.module('login-module', [])

.service('SessionService', function ($q, $http, $state, $cookieStore) {
	var parent = this;

	function login_private (username) {
		var deferred = $q.defer();

		$http({ method:'GET', url:config.temp_login + '/' + username }).then( function (response) {
			deferred.resolve(response);
		}, function (error) {
			deferred.reject(error);
		});	
		return deferred.promise;
	};

	this.login = function (user) {
		login_private(user.username).then( function (response) {
			var log_user = response.data;
			if (log_user.password == user.password) {
				parent.save_user_data(log_user);
				$state.go('user.dashboard');
			} else {
				error_response(user.username);
			}
		}, function (error) {
			error_response(user.username);
		});
	};

	this.logs = function (logs) {
		var deferred = $q.defer();

		$http({ method:'POST', url:config.logs, data:logs }).then( function (response) {
			deferred.resolve(response);
		}, function (error) {
			deferred.reject(error);
		});
		return deferred.promise;
	};

	this.save_user_data = function (data) {
		$cookieStore.put ('user', data);
	};

	this.get_user_data = function () {
		return $cookieStore.get('user');
	};

	this.isLoggedIn = function () {
		var data = parent.get_user_data();
        if (data) {
            return true;
        } else {
            return false;
        }
	};

	function error_response (user) {
		document.getElementById('message').innerHTML 	= 'Login failed for user ' + '"' + user + '"';
		document.getElementById('login-username').value = '';
		document.getElementById('login-password').value = '';
	};

	this.alert_messages = function () {
		$("#success-alert").hide();
	};

})

.controller('LoginController', function ($scope, $state, SessionService) {
	$scope.user 			= {};
	SessionService.alert_messages();
	
	$scope.login = function (user) {
		SessionService.login(user);
	};

	$scope.reset_message = function () {
		document.getElementById('message').innerHTML = 'Please sign in to get access.';
	};

})