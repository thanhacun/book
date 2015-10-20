'use strict';

angular.module('bookApp')
  .controller('BookCtrl', function ($scope, $http, Auth, socket) {
    $scope.showAllBook = $scope.showAllBook || false;
    $scope.currentUser = Auth.getCurrentUser();
    $scope.books = [];

    $scope.getBooks = function() {
      $http.get('/api/books').success(function(books) {
        console.log(books[0].status);
        if ($scope.showAllBook) {
          $scope.books = books;
        } else {
          $scope.books = books.filter(function(book) {
            if (book.users.indexOf(Auth.getCurrentUser()._id) === -1) {return false;}
            return true;
          });
        }
        //$scope.books = books;
        socket.syncUpdates('book', $scope.books);
      });
    };

    $scope.getBooks();

    $scope.allBookToggle = function() {
      $scope.showAllBook = !$scope.showAllBook;
      $scope.getBooks();
      //$scope.$apply();
    }

    $scope.newBook = function(bookTitle) {
      //query the title
      $http.get('/api/books/' + bookTitle).success(function(book){
        console.log(book);
        if (book.id) {
          //add new title to database if exists
          $http.post('/api/books', {
            name: book.volumeInfo.title,
            vol_id: book.id,
            vol_url: book.volumeInfo.canonicalVolumeLink,
            cover_url: book.volumeInfo.imageLinks.thumbnail,
            des: book.volumeInfo.description,
            user: Auth.getCurrentUser()._id
          }).success(function(newBook) {
            console.log('Added new book:', newBook.name);
            $scope.newBook.title = '';
          });
        }
      });
    };

    $scope.exchageBook = function(book) {
      console.log('Exchange Book');
    };

    $scope.deleteBook = function(bookID) {
      console.log('Delete book from user', Auth.getCurrentUser()._id);
      $http.delete('/api/books/' + bookID);
    }
  });
