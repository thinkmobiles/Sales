/**
 * Created by Roman on 01.04.2015.
 */

module.exports = function (mainDb) {
    var http = require('http');
    var path = require('path');
    var fs = require("fs");
    var express = require('express');
    var session = require('express-session');
    var logger = require('morgan');
    var cookieParser = require('cookie-parser');
    var bodyParser = require('body-parser');
    var consolidate = require('consolidate');
    var app = express();


    var logWriter = require('./helpers/logWriter')();

    var MemoryStore = require('connect-mongo')(session);

    var sessionConfig = {
        db: mainDb.name,
        host: mainDb.host,
        port: mainDb.port,
        saveUninitialized: false,
        resave: false,
        reapInterval: 500000
    };

    app.engine('html', consolidate.swig);
    app.set('view engine', 'html');
    app.set('views', __dirname + '/views');
    app.use(logger('dev'));
    app.use(bodyParser.json({strict: false, inflate: false, limit: 1024 * 1024 * 200}));
    app.use(bodyParser.urlencoded({extended: false, limit: 1024 * 1024 * 200}));
    app.use(cookieParser("sales"));
    app.use(express.static(path.join(__dirname, 'public')));

    app.use(session({
        name: 'sales',
        secret: '1q2w3e4r5tdhgkdfhw45hfh56fghfhgejflkejgkdlgh8j0jge4547hh',
        resave: false,
        saveUninitialized: false,
        /*cookie: {
            path: '/',
            domain: ".live.easyerp.com"
        },*/
        store: new MemoryStore(sessionConfig)
    }));

    require('./routes/index')(app, mainDb);


    return app;
};