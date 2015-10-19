'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var BookSchema = new Schema({
  name: String,
  vol_id: String,
  cover_url: String,
  des: String,
  user: {type: Schema.Types.ObjectId, ref: 'User'}
});

module.exports = mongoose.model('Book', BookSchema);
