/**
 * Created by truong-quang-thanh on 10/20/2015.
 * Modules to keep helper functions
 */
'use strict';

var request = require('request');
var async = require('async');
var _ = require('lodash');

/**
 * Forward to google book api with api key
 * Serving auto complete search
 */
exports.search = function(bookTitle, cb) {
  var bookSearchTerms = '&printType=books';
  var bookSearchConditions = '&key=' + process.env.GOOGLE_API;
  var googleBookApiOptions = {
    uri: 'https://www.googleapis.com/books/v1/volumes?q=' + bookTitle + bookSearchTerms + bookSearchConditions,
    json: true
  };
  request(googleBookApiOptions, function(error, response, body) {
    console.log(googleBookApiOptions.uri);
    if (error || response.statusCode !== 200) return cb('Something wrong', body);
    return cb(null, body);
  });
};

/**
 * Process books in database to add some extra information based on user login
 * owned: true|false; asked: true|false; askable: true|false; asking: true|false
 */
exports.extraInfo = function(books, userId, cb) {

  var addExtra = function(book, doneCallback) {

    book.status.owned = book.users.some(function(user){ return user.toString() === userId.toString(); });
    book.status.asked = book.status.owned && book.trades.length > 0;
    book.status.askable = !book.status.owned
      && book.trades.length < book.users.length
      && !book.trades.some(function(user) { return user.toString() === userId.toString(); });
    book.status.asking = !book.status.askable
      && book.trades.some(function(user) { return user.toString() === userId.toString(); });

    return doneCallback(null, book);
  };

  async.map(books, addExtra, function(error, addExtraBooks) {
    if (error) {return cb(error, addExtraBooks);}
    return cb(null, addExtraBooks);
  });

};
