'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var BookSchema = new Schema({
  name: String,
  vol_id: String,
  cover_url: String
});

module.exports = mongoose.model('Book', BookSchema);
