'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var BookSchema = new Schema({
  name: String,
  vol_id: {type: String, unique: true},
  vol_url: String,
  cover_url: String,
  des: String,
  users: [{type: Schema.Types.ObjectId, ref: 'User'}],
  trades: [{
    asked: {type: Schema.Types.ObjectId, ref: 'User'},
    asker: {type: Schema.Types.ObjectId, ref: 'User'}
  }],
  status: {
    owned: Boolean,
    asked: Boolean,
    askable: Boolean
  }
});

module.exports = mongoose.model('Book', BookSchema);
