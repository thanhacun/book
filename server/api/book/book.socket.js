/**
 * Broadcast updates to client when the model changes
 */

'use strict';
var helper = require('./helper');

var Book = require('./book.model');

exports.register = function(socket) {
  //helper.extraInfo need user info to attach extra information to the book
  //using socket to send this information.
  socket.on('User modifies a book', function(user) {
    Book.schema.post('save', function (doc) {
      helper.extraInfo([doc], user._id, function(error, extraDoc) {
        if (!error) {onSave(socket, extraDoc[0]);}
      });
    });
  });

  Book.schema.post('remove', function (doc) {
    onRemove(socket, doc);
  });
}

function onSave(socket, doc, cb) {
  socket.emit('book:save', doc);
}

function onRemove(socket, doc, cb) {
  socket.emit('book:remove', doc);
}
