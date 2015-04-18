/**
 * Created by Roman on 01.04.2015.
 */
var RESPONSES = ('../constants/responses');
var mongoose = require('mongoose');
var crypto = require('crypto');
var Users = function (db) {

    var UsersSchema = mongoose.Schemas['Users'];
    var User = db.model('users', UsersSchema);

    this.auth = function (req, res, next) {
        var body = req.body;
        var login = body.login;
        var pass = body.pass;
        var shaSum = crypto.createHash('sha256');
        var err;
        var query;
        var now = new Date();
        var update = {
            $set: {
                loggedIn: now
            }
        };

        shaSum.update(pass);
        pass = shaSum.digest('hex');

        if(login && pass) {
            query = {
                login: login,
                pass: pass
            };

            User.findOneAndUpdate(query, update, function (err, user) {
                if (err) {
                    return next(err);
                }
                if(!user){
                    err = new Error(RESPONSES.INVALID_PARAMETERS);
                    err.status = 400;
                    return next(err)
                }

                req.session.loggedIn = now.valueOf();
                res.status(200).send({success: 'tracked'})
            });
        } else {
            err = new Error(RESPONSES.INVALID_PARAMETERS);
            err.status = 400;
            next(err)
        }
    };
};

module.exports = Users;
