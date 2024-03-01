const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const errorhandler = require('errorhandler');
const { v4: uuidv4 } = require('uuid');

require('dotenv').config()
var isProduction = process.env.NODE_ENV === 'production';

// Create global app object
var app = express();

//app.use(require('./cors'));
app.use(cors({
  origin: '*'
}));

// Normal express config defaults
app.use(require('morgan')('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(require('method-override')());
app.use(express.static(__dirname + '/public'));

app.use(session({
    secret: 'Xyameshgyrtj7ikagasdrS37x6jasdjfay18akjaK82Ye3kjoguy9nsd7435hwofia', 
    cookie: { maxAge: 60000 }, 
    resave: false, 
    saveUninitialized: false 
}));

const cookieSecret = 'XyameshgyrtjrS37x63kjogXtemsdjfaikay18akjaKgasd98Oyem27435hwofia';
app.use(cookieParser(cookieSecret));

// set a cookie
app.use(function (req, res, next) {
  const cookie = req.cookies.taqId;
  if (cookie === undefined) {
    //res.cookie('taqId', uuidv4(), { maxAge: 900000, httpOnly: true });
    res.cookie('taqId', uuidv4(), { httpOnly: true });
    console.log('cookie created successfully');
  }
  next();
});

if (!isProduction) {
  app.use(errorhandler());
}


app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);

  next();
});

/*if(isProduction){
  mongoose.connect(process.env.MONGODB_URI);
} else {
  mongoose.connect('mongodb://localhost/conduit');
  mongoose.set('debug', true);
}

require('./models/User');
require('./models/Article');
require('./models/Comment');
require('./config/passport');*/

app.use(require('./routes'));

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (!isProduction) {
  app.use(function(err, req, res, next) {
    console.log(err.stack);

    res.status(err.status || 500);

    res.json({'errors': {
      message: err.message,
      error: err
    }});
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.json({'errors': {
    message: err.message,
    error: {}
  }});
});

// finally, let's start our server...
var server = app.listen( process.env.PORT || 3333, function(){
  console.log('Listening on port ' + server.address().port);
});
