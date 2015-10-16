'use strict';

angular.module('bookApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/book', {
        templateUrl: 'app/book/book.html',
        controller: 'BookCtrl'
      });
  });
