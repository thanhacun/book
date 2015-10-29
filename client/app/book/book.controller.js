'use strict';

angular.module('bookApp')
  .controller('BookCtrl', function ($scope, $http, $timeout, Auth, socket) {
    $scope.features = [
      'List my books and all books', 'Add new book, ask for a book', 'Exchange books', 'Sync across clients', 'Optimize database', 'Auto-compete search'
    ];
    $scope.dataLoading = false;
    $scope.showAllBook = $scope.showAllBook || false;
    $scope.currentUser = Auth.getCurrentUser();
    $scope.books = [];
    $scope.minLength = 5;
    var tick = 1000;
    $scope.timeToSearch = false;

    $scope.getBooks = function() {
      $scope.dataLoading = true;
      $http.get('/api/books').success(function(books) {
        //return books: all books OR owned books AND asking books
        //then sorted by asking book first
        $scope.sortBooks(books);
        $scope.dataLoading = false;
      });
    };

    $scope.sortBooks = function(books) {
      $scope.books = books || $scope.books;
      $scope.books = _.chain($scope.books)
        .sortBy(function(book) {
          if (book.status.asking) return 0;
          if (book.status.asked) return 1;
          return 2;
        })
        .value();
    }

    $scope.getBooks();

    $scope.allBookToggle = function() {
      $scope.showAllBook = !$scope.showAllBook;
      $scope.getBooks();
    };

    var countTick = function() {
      $scope.timeToSearch = true;
      //console.log(Date.now());
      $timeout(countTick, tick);
    };

    $timeout(countTick, tick);

    $scope.modifyBook = {
      sendUpdateNotify: function(message) {
        message = message || 'User is modifying a book';
        $scope.dataLoading = true;
      },
      searchBook: function() {
        //TODO search every some mili-seconds
        if ($scope.searchTitle.length >= $scope.minLength) {
          $scope.dataLoading = true;
          $http.get('/api/books/search/' + $scope.searchTitle).success(function(result) {
              //if (!result.items) return {};
              $scope.searchResults = result.items.map(function(item) {
                if (item.volumeInfo.title && item.volumeInfo.authors && item.volumeInfo.publishedDate) {
                  return {
                    label: item.volumeInfo.title + ', ' + item.volumeInfo.authors[0] + ', ' + item.volumeInfo.publishedDate,
                    name: item.volumeInfo.title,
                    vol_id: item.id,
                    vol_url: item.volumeInfo.canonicalVolumeLink,
                    cover_url: (item.volumeInfo.imageLinks) ? item.volumeInfo.imageLinks.thumbnail : 'http://placehold.it/128x190',
                    rate: item.volumeInfo.averageRating || 0,
                    des: item.volumeInfo.description,
                    user: Auth.getCurrentUser()._id
                  };
                } else {
                  return {};
                }
              });
              $scope.dataLoading = false;
            });
        } else {
            $scope.searchResults = [];
        }

      },
      selectBook: function(select) {
        this.sendUpdateNotify('User add a new book');
        this.clearSearch();
        console.log(select);
        $http.post('/api/books', select).success(function(newBook) {
          console.log(Auth.getCurrentUser().name, 'added a new book of', newBook.name);
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

      },
      clearSearch: function() {
        $scope.searchTitle = '';
        $scope.searchResults = [];
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
      $scope.sortBooks();
      console.log('There is a change in the book of', updatedBook.name);
      //$scope.$apply();
      $scope.dataLoading = false;
    });
    socket.socket.on('book:remove', function(deletedBook) {
      _.remove($scope.books, {_id: deletedBook._id});
      $scope.sortBooks();
      console.log('Delete the book of', deletedBook.name);
      $scope.dataLoading = false;
    });
    $scope.$on('$destroy', function() {
      socket.unsyncUpdates('book');
    });
  });
