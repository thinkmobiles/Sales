/**
 * Created by Roman on 01.04.2015.
 */
var RESPONSES = ('../constants/responses');
var mongoose = require('mongoose');

var Events = function (db) {

    var EvantsSchema = mongoose.Schemas['Events'];
    var Events = db.model('Events', EvantsSchema);

    this.track = function (req, res, next) {
        var body = req.body;
        var event = new Events(body);

        event.save(function(err, event){
            if(err){
                return next(err);
            }

            res.status(200).send({success: 'tracked'})
        });
    };

    this.getStats = function (req, res, next) {
        var query = req.query;
        var startDate = query.start;
        var endDate = query.end;
        var zoom = query.z;
        var groupBy = query.g;

        Events.find({}, function(err, events){
            if(err){
                return next(err);
            }

            res.status(200).send({success: events})
        });
    };
};

module.exports = Events;
