/**
 * Created by truong-quang-thanh on 10/20/2015.
 * Modules to keep helper functions
 */
'use strict';

var request = require('request');
var async = require('async');

/**
 * Query book title from Google book
 * exact title | query volumes | return first result
 */
exports.query = function(bookTitle, cb) {
  //var bookTitle = req.params.bookTitle;
  var bookSearchTerms = '';
  var bookSearchConditions = '&key=' + process.env.GOOGGLE_API;
  var googleBookApiOptions = {
    uri: 'https://www.googleapis.com/books/v1/volumes?q=' + bookTitle + bookSearchTerms + bookSearchConditions,
    json: true
  };

  request(googleBookApiOptions, function(error, response, body) {
    if (error || response.statusCode !== 200) return cb('Something wrong', {});
    //Return exact title match, otherwise first result
    //TODO: CAN MAKE IT BETTER?
    var result = body.items.filter(function(volume){
      return volume.volumeInfo.title.toLowerCase() === bookTitle.toLowerCase();
    });
    if (!result.length) {result = [body.items[0]];}

    return cb(null, result[0]);
  })
};

/**
 * Process books in database to add some fields
 * owned: true|false; asked: true|false; askable: true|false
 */
exports.extraInfo = function(books, userId, cb) {
  var addExtra = function(book, doneCallback) {
    //user owned the book
    book.status.owned = book.users.reduce(function(a, c) {
      if (!a) {return userId.toString() === c.toString();}
    }, false);
    if (book.status.owned) {
      //is someone asking for the book
      //book.status.askable = false;
      book.status.asked = book.trades.reduce(function(a, c) {
        if (!a) {return userId.toString() === c.asked.toString();}
      }, false);
    } else {
      //can user asks for the book
      book.status.askable = book.users.length > book.trades.length;
    }
    //console.log('book', book);
    return doneCallback(null, book);
  };

  async.map(books, addExtra, function(error, addExtraBooks) {
    if (error) {return cb(error, addExtraBooks);}
    return cb(null, addExtraBooks);
  });

};
