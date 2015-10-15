'use strict';

angular.module('bookApp')
  .controller('SettingsCtrl', function ($scope, $http, User, Auth) {
    $scope.user = Auth.getCurrentUser();
    $scope.errors = {};

    $scope.changePassword = function(form) {
      $scope.submitted = true;
      if(form.$valid) {
        Auth.changePassword( $scope.user.oldPassword, $scope.user.newPassword )
        .then( function() {
          $scope.message = 'Password successfully changed.';
        })
        .catch( function() {
          form.password.$setValidity('mongoose', false);
          $scope.errors.other = 'Incorrect password';
          $scope.message = '';
        });
      }
		};

    /**
     * Update user information
     */
    $scope.updateUser = function(user) {
      //console.log(User());
      console.log(Auth);
      $http.put('/api/users/' + Auth.getCurrentUser()._id, user).success(function(updatedUser) {
        console.log(JSON.stringify(updatedUser, null, 2));
      });
    };
  });
