'use strict';

angular.module('bookApp')
  .controller('BookCtrl', function ($scope, $http, Auth, socket) {
    $scope.showAllBook = $scope.showAllBook || false;
    $scope.currentUser = Auth.getCurrentUser();
    $scope.books = [];

    $scope.getBooks = function() {
      $http.get('/api/books').success(function(books) {
        $scope.books = books.filter(function(book) {
          return book.status.owned || $scope.showAllBook;
        });
        socket.syncUpdates('book', $scope.books, function(e, i, a) {
          console.log(e, i);
        });
      });
    };

    $scope.getBooks();

    $scope.allBookToggle = function() {
      $scope.showAllBook = !$scope.showAllBook;
      $scope.getBooks();
      //$scope.$apply();
    }
    $scope.modifyBook = {
      sendUserInfo: function() {
        socket.socket.emit('User modifies a book', Auth.getCurrentUser());
      },
      newBook: function(bookTitle) {
        this.sendUserInfo();
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
      },
      deleteBook: function(bookID) {
        console.log('Delete book from user', Auth.getCurrentUser()._id);
        $http.delete('/api/books/' + bookID);
      },
      exchangeBook: function(book) {
        this.sendUserInfo();
        var askedList = book.trades.map(function(pair) {
          return pair.asked;
        });
        //book.trades.push({});
        console.log('Exchange Book');
      },
      changeBook: function(book) {
        this.sendUserInfo();
        console.log('Change Book');
      }
    };

    $scope.deleteBook = function(bookID) {
      console.log('Delete book from user', Auth.getCurrentUser()._id);
      $http.delete('/api/books/' + bookID);
    }
  });
