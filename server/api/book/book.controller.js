'use strict';

var _ = require('lodash');

var helper = require('./helper');
var Book = require('./book.model');

//Query book from google book api: exact title | query volumes | return first result
exports.query = function(req, res) {
  helper.query(req.params.bookTitle, function(error, result) {
    if (error) return res.status(500).json({});
    return res.status(200).json(result);
  });
};

// Get list of all books
exports.index = function (req, res) {
  Book.find(function(err, allBooks) {
    if (err) {return handleError(res, err);}
    helper.extraInfo(allBooks, req.user._id, function(error, processBooks) {
      //console.log('Book', processBooks);
      if (error) {return handleError(res, error);}
      return res.status(200).json(processBooks);
    });
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
  var receivedBook = req.body;
  //Check vol_id exist: vol_id is unique
  //Check users exist
  Book.findOne({vol_id:req.body.vol_id}, function(err, book) {
    if (err) return res.status(500).json({});
    if (book) {
      //book already added --> push user
      book.users.push(req.user._id);
      book.save(function(err) {
        if (err) {return handleError(res, err);}
        return res.status(200).json(book);
      });
    } else {
      //create new book
      receivedBook.users = [req.user._id];
      Book.create(receivedBook, function(err, newBook) {
        if (err) {return handleError(err, book);}
        return res.status(201).json(newBook);
      })
    }
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
    //remove user out of user list
    book.users = book.users.filter(function(user) {
      return user.toString() !== req.user._id.toString();
    });
    //delete book if user list is empty otherwise update
    if (book.users.length === 0) {
      //delete
      book.remove(function(err){
        if (err) {return handleError(res, err);}
        return res.status(200).end();
      });
    } else {
      //update
      book.save(function(err) {
        if (err) {return handleError(res, err);}
        return res.status(200).json(book);
      });
    }

  });
};

function handleError(res, err) {
  return res.status(500).send(err);
}
