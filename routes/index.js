/**
 * Created by Roman on 02.04.2015.
 */

module.exports = function (app, mainDb) {
    var eventsRouter = require('./events')(mainDb);
    var logWriter = require('../helpers/logWriter')();
    var RESPONSES = require('../constants/responses');
    var multipart = require('connect-multiparty');
    var multipartMiddleware = multipart();
    var mongoose = require('mongoose');

    var UserHandler = require('../handlers/users.js');
    var usersHandler = new UserHandler(mainDb);

    function auth(req, res, next){
        if(req.session && req.session.loggedIn){
            return res.status(200).send();
        }
        res.status(401).send();
    }

    app.get('/', function (req, res, next) {
        res.sendfile('index.html');
    });

    app.get('/authenticated', auth);

    app.post('/login', usersHandler.auth);

    app.use('/events', eventsRouter);

    function notFound (req, res, next) {
        res.status(404);

        if (req.accepts('html')) {
            return res.send(RESPONSES.PAGE_NOT_FOUND);
        }

        if (req.accepts('json')) {
            return res.json({error: RESPONSES.PAGE_NOT_FOUND});
        }

        res.type('txt');
        res.send(RESPONSES.PAGE_NOT_FOUND);
    };

    function errorHandler (err, req, res, next) {
        var satus = err.status || 500;

        if (process.env.NODE_ENV === 'production') {
            if (satus === 401) {
                logWriter.log('', err.message + '\n' + err.stack);
            }
            res.status(satus).send({error: err.message});
        } else {
            if (satus !== 401) {
                logWriter.log('', err.message + '\n' + err.stack);
            }
            res.status(satus).send({error: err.message + '\n' + err.stack});
        }
    };

    app.use(notFound);
    app.use(errorHandler);
};