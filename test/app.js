var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var methodOverride = require('method-override');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var MongoStore = require('connect-mongo')(session);
var settings = require('./settings');
var flash = require('connect-flash');
var routes = require('./routes/index');
var users = require('./routes/users');
var multer = require('multer');
var fs = require('fs');
var accessLog = fs.createWriteStream('access.log',{flags:'a'});
var errorLog = fs.createWriteStream('error.log', {flags:'a'});


var partials = require('express-partials');
var app = express();
var passport = require('passport')
    , GithubStrategy = require('passport-github').Strategy;
app.use(multer({
  dest: './public/images',//上传图片目录
  rename: function(fieldname, filename){ //rename是修改上传后的文件名
    return filename;
  }
}));
app.use(session({
  secret: settings.cookieSecret,
  key: settings.db,//cookie name
  cookie:{maxAge:1000*60*60*24*30},//30 days
  store: new MongoStore({
    // db: settings.db,
    // host: settings.host,
    // port: settings.port
    url:'mongodb://localhost/blog'
  }),
  resave:false,
  saveUninitialized:true

}));
// app.configure(function(){ 
//   app.set('views', __dirname + '/views'); 
//   app.set('view engine', 'ejs'); 
//   app.use(express.bodyParser()); 
//   app.use(express.methodOverride()); 
//   app.use(express.cookieParser()); 
//   app.use(express.session({ 
//     secret: settings.cookieSecret, 
//     store: new MongoStore({ 
//       db: settings.db 
//     }) 
//   })); 
//   app.use(express.static(__dirname + '/public')); 
// });
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(partials());
app.use(flash());

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(logger({stream:accessLog}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(function(err, req, res, next){
  var meta = '['+new Date()+']'+req.url+'\n';
  errorLog.write(meta+err.stack+'\n');
  next();
});
routes(app);
app.use('/', routes);
app.use('/users', users);
app.use(passport.initialize());//初始化 Passport
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers
passport.use(new GithubStrategy({
  clientID: "3a79ca8abc0eec71ad6d",
  clientSecret: "4d8282adac489cae5ef87f459ea152e726d98bcd",
  callbackURL: "http://localhost:3000/login/github/callback"
}, function(accessToken, refreshToken, profile, done) {
  done(null, profile);
}));
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
