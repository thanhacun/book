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
        //socket.syncUpdates('book', $scope.books, function(e, i, a) {
        //  console.log(e, i);
        //});
        //console.log(JSON.stringify(books));
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
        //this.sendUserInfo();
        //query the title
        $http.get('/api/books/' + bookTitle).success(function(book){
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
              $scope.newBook.title = '';
            });
          }
        });
      },
      deleteBook: function(bookID) {
        $http.delete('/api/books/' + bookID);
      },
      askBook: function(askedBook) {
        askedBook.trades.push(Auth.getCurrentUser()._id);
        $http.put('/api/books/' + askedBook._id , askedBook).success(function(updatedBook) {
          console.log(Auth.getCurrentUser().name, 'asked for the book of', updatedBook.name);
        })

      },
      exchangeBook: function(giveBook) {
        //change owner of the book with the first user in trades
        var newOwner = giveBook.trades.splice(0, 1);
        var currOwnerIndex = giveBook.users.indexOf(Auth.getCurrentUser()._id);
        giveBook.users.splice(currOwnerIndex, 1, newOwner);
        $http.put('/api/books/' + giveBook._id, giveBook).success(function(updatedBook) {
          console.log(Auth.getCurrentUser().name, 'given the book of', updatedBook.name);
        });

      }
    };
    /**
     * TODO: DRY the code here with syncUpdate function
     */
    socket.socket.on('book:save', function(updatedBook){
      //update extra information
      updatedBook.status = {};
      updatedBook.status.owned = updatedBook.users.some(function(user) { return user === Auth.getCurrentUser()._id; });
      updatedBook.status.asked = updatedBook.status.owned && updatedBook.trades.length > 0;
      updatedBook.status.askable = !updatedBook.status.owned
        && updatedBook.trades.length < updatedBook.users.length
        && !(updatedBook.trades.some(function(user) { return user === Auth.getCurrentUser()._id; }));

      //update scope
      var foundBook = _.find($scope.books, {_id: updatedBook._id});
      var foundIndex = $scope.books.indexOf(foundBook);
      //remove old item before push updated or new one
      if (foundBook) {
        $scope.books.splice(foundIndex, 1, updatedBook);
      } else {
        //only push new book to owner and or when showing all Books
        if (updatedBook.status.owned || $scope.showAllBook) {$scope.books.push(updatedBook);}
      }
      console.log('There is a change in the book of', updatedBook.name);
    })
    socket.socket.on('book:remove', function(deletedBook) {
      _.remove($scope.books, {_id: deletedBook._id});
      console.log('Delete the book of', deletedBook.name);
    })
  });
