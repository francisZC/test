var crypto = require('crypto');
var mongodb = require('./db'); 
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/blog');

var userSchema = new mongoose.Schema({
  name:String,
  password:String,
  email:String,
  head:String
},{
  collection:"users"
});
var userModel = mongoose.model('User',userSchema); 
function User(user) { 
  this.name = user.name; 
  this.password = user.password; 
  this.email = user.email;
}; 
module.exports = User; 
 
User.prototype.save = function(callback) { 
  // 存入 Mongodb 的文档 
  var md5 = crypto.createHash('md5'),
  email_MD5 = md5.update(this.email.toLowerCase()).digest('base64'),
  head = "http://www.gravatar.com/avartar/"+ email_MD5+"?s=48";
  var user = { 
    name: this.name, 
    password: this.password, 
    email: this.email,
    head:head
  }; 
  var newUser = new userModel(user);
 newUser.save(function (err, user) {
    if (err) {
      return callback(err);
    }
    callback(null, user);
  });
};

User.get = function(name, callback) {
  userModel.findOne({name: name}, function (err, user) {
    if (err) {
      return callback(err);
    }
    callback(null, user);
  });
};