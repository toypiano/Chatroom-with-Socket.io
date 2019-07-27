require('dotenv').config();
'use strict'

const assert = require('assert');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');

const auth = require('./app/auth.js');
const routes = require('./app/routes.js');
const MongoClient = require('mongodb').MongoClient;
const cookieParser = require('cookie-parser');


const app = express();
const http = require('http').Server(app);
const sessionStore = new session.MemoryStore();
const io = require('socket.io')(http);
const passportSocketIo = require("passport.socketio");

app.use('/public', express.static(process.cwd() + '/public'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'pug')

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  key: 'express.sid', // session cookie name
  store: sessionStore
}));

MongoClient.connect(process.env.DATABASE, { useNewUrlParser: true }, (err, client) => {
  assert.equal(err, null);
  console.log("Database successfully connected.");
  var db = client.db('test');

  auth(app, db);
  routes(app, db);

  http.listen(process.env.PORT || 3000);

  io.use(passportSocketIo.authorize({
    cookieParser: cookieParser, 
    key: 'express.sid', // the name of the cookie where express/connect stores its session_id
    secret: process.env.SESSION_SECRET, // session_secret to parse the cookie
    store: sessionStore, // doc says "no memorystore please". fcc uses memorystore
    success: onAuthorizeSuccess, // opt: success callback
    fail: onAuthorizeFail // opt: failure callback
  }));

  function onAuthorizeSuccess(data, accept) {
    console.log('successful connection to socket.io');
    accept(); // acceot(null, ture) for socket.io < 1.0
  }

  function onAuthorizeFail(data, message, error, accept) {
    if(error) throw new Error(message);
    console.log('failed connection to socket.io', message);
    accept(new Error(message)); // this error will be sent to the user as a special error package
    // accept(null, false) for socket.io < 1.0
  }
  
  var currentUsers = 0;
  io.on('connection', socket => {
    ++currentUsers;
    console.log('user ' + socket.request.user.name + ' connected');
    io.emit('user', {name: socket.request.user.name, currentUsers, connected: true});

    socket.on('chat message', (message) => {
      io.emit('chat message', {name: socket.request.user.name, message});
    });

    socket.on('disconnect', () => {
      --currentUsers;
      io.emit('user', {name: socket.request.user.name, currentUsers, connected: false});
    });
  });

});