'use strict';

var _ = require('lodash');
var request = require('request');
var Book = require('./book.model');

//Query book from google book api: exact title | query volumes | return first result
exports.query = function(req, res) {
  var bookTitle = req.params.bookTitle;
  var bookSearchTerms = '';
  var bookSearchConditions = '&key=' + process.env.GOOGGLE_API;
  var googleBookApiOptions = {
    uri: 'https://www.googleapis.com/books/v1/volumes?q=' + bookTitle + bookSearchTerms + bookSearchConditions,
    json: true
  };

  request(googleBookApiOptions, function(error, response, body) {
    if (error || response.statusCode !== 200) return res.status(500).json({});
    //Return exact title match, otherwise first result
    //TODO: CAN MAKE IT BETTER?
    var result = body.items.filter(function(volume){
      return volume.volumeInfo.title.toLowerCase() === bookTitle.toLowerCase();
    });
    if (!result.length) {result = [body.items[0]];}

    return res.status(200).json(result[0]);
  })
};

// Get list of books
exports.index = function(req, res) {
  Book.find(function (err, books) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(books);
  });
};

// Get a single book
exports.show = function(req, res) {
  Book.findById(req.params.id, function (err, book) {
    if(err) { return handleError(res, err); }
    if(!book) { return res.status(404).send('Not Found'); }
    return res.json(book);
  });
};

// Creates a new book in the DB.
exports.create = function(req, res) {
  Book.create(req.body, function(err, book) {
    if(err) { return handleError(res, err); }
    return res.status(201).json(book);
  });
};

// Updates an existing book in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Book.findById(req.params.id, function (err, book) {
    if (err) { return handleError(res, err); }
    if(!book) { return res.status(404).send('Not Found'); }
    var updated = _.merge(book, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.status(200).json(book);
    });
  });
};

// Deletes a book from the DB.
exports.destroy = function(req, res) {
  Book.findById(req.params.id, function (err, book) {
    if(err) { return handleError(res, err); }
    if(!book) { return res.status(404).send('Not Found'); }
    book.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.status(204).send('No Content');
    });
  });
};

function handleError(res, err) {
  return res.status(500).send(err);
}
