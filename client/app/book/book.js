'use strict';

angular.module('bookApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'app/book/book.html',
        controller: 'BookCtrl'
      });
  });
