/**
 * Created by Roman on 01.04.2015.
 */
var express = require('express');
var router = express.Router();
var Events = require('../handlers/events');

function isMasterLoggedIn(req, res, next){
    var err;

    if(req.session && req.session.uName === 'saasAdmin'){
        return next();
    }

    err = new Error('You don\'t hav any rights for list');
    err.status = 400;
    next(err);
}

module.exports = function (db) {
    var eventsHandler = new Events(db);

    router.get('/', eventsHandler.getStats);
    router.get('/count', eventsHandler.getCount);
    router.post('/', eventsHandler.track);

    return router;
};