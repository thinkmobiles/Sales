/**
 * Created by Roman on 01.04.2015.
 */
var express = require('express');
var router = express.Router();
var Saas = require('../handlers/events');

function isMasterLoggedIn(req, res, next){
    var err;

    if(req.session && req.session.uName === 'saasAdmin'){
        return next();
    }

    err = new Error('You don\'t hav any rights for list');
    err.status = 400;
    next(err);
}

module.exports = function (mainDb) {

    /*router.get('/', function(req, res, next){
        res.render('saas.html');
    });*/
    router.get('/stats', isMasterLoggedIn, eventsHandler.stats);
    //router.get('/clientList/count', isMasterLoggedIn, subDomainHandler.count);
    router.post('/', eventsHandler.track);

    return router;
};