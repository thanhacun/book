/**
 * Populate DB with sample data on server start
 * to disable, edit config/environment/index.js, and set `seedDB: false`
 */

'use strict';

var Book = require('../api/book/book.model');
var User = require('../api/user/user.model');

User.find({email: 'admin@admin.com'}, function(adminUser) {
  if(!adminUser) {
    User.create({
      provider: 'local',
      role: 'admin',
      name: 'Admin',
      email: 'admin@admin.com',
      password: '200599Bj'
    }, function() {
      console.log('finished initiate admin user');
    })
  }
});
