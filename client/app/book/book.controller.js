'use strict';

angular.module('bookApp')
  .controller('BookCtrl', function ($scope, $http, Auth, socket) {
    $scope.features = [
      'List my books and all books', 'Add new book, ask for a book', 'Exchange books', 'Sync across clients', 'Optimize database'
    ]
    $scope.dataLoading = false;
    $scope.showAllBook = $scope.showAllBook || false;
    $scope.currentUser = Auth.getCurrentUser();
    $scope.books = [];

    $scope.getBooks = function() {
      $scope.dataLoading = true;
      $http.get('/api/books').success(function(books) {
        //return books: all books OR owned books AND asking books
        //then sorted by asking book first
        $scope.books = _.chain(books)
          .filter(function(book) {
            return $scope.showAllBook || book.status.asking || book.status.owned;
          })
          .sort(function(book){
            return !book.status.asking;
          })
          .value();
        $scope.dataLoading = false;
      });
    };

    $scope.getBooks();

    $scope.allBookToggle = function() {
      $scope.showAllBook = !$scope.showAllBook;
      $scope.getBooks();
    }
    $scope.modifyBook = {
      sendUpdateNotify: function(message) {
        message = message || 'User is modifying a book';
        socket.socket.emit('User modifies a book', {title: message});
      },
      newBook: function(bookTitle) {
        this.sendUpdateNotify('Add new book');
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
        this.sendUpdateNotify('Delete a book');
        $http.delete('/api/books/' + bookID);
      },
      askBook: function(askedBook) {
        this.sendUpdateNotify('Asking for a book');
        askedBook.trades.push(Auth.getCurrentUser()._id);
        $http.put('/api/books/' + askedBook._id , askedBook).success(function(updatedBook) {
          console.log(Auth.getCurrentUser().name, 'asked for the book of', updatedBook.name);
        })

      },
      exchangeBook: function(giveBook) {
        this.sendUpdateNotify('Exchange a book');
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
      updatedBook.status.asking = !updatedBook.status.askable
        && (updatedBook.trades.some(function(user) { return user === Auth.getCurrentUser()._id; }));

      //update scope
      var foundBook = _.find($scope.books, {_id: updatedBook._id});
      var foundIndex = $scope.books.indexOf(foundBook);
      //remove old item before push updated or new one
      if (foundBook) {
        //update the book or remove if no longer own
        if ($scope.showAllBook || updatedBook.status.owned) {
          $scope.books.splice(foundIndex, 1, updatedBook);
        } else {
          $scope.books.splice(foundIndex, 1);
        }
      } else {
        //only push if: show all books OR owned the book OR asking for a book
        if ($scope.showAllBook || updatedBook.status.owned || updatedBook.status.asking ) {$scope.books.push(updatedBook);}
      }
      console.log('There is a change in the book of', updatedBook.name);
      $scope.dataLoading = false;
    })
    socket.socket.on('book:remove', function(deletedBook) {
      _.remove($scope.books, {_id: deletedBook._id});
      console.log('Delete the book of', deletedBook.name);
      $scope.dataLoading = false;
    })
    socket.socket.on('book:http', function(message) {
      console.log(message.title);
      $scope.dataLoading = true;
    });
  });
