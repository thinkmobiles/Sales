/**
 * Created by Roman on 01.04.2015.
 */
var RESPONSES = ('../constants/responses');
var mongoose = require('mongoose');
var _ = require('lodash')

var Events = function (db) {

    var EvantsSchema = mongoose.Schemas['Events'];
    var Events = db.model('Events', EvantsSchema);

    this.track = function (req, res, next) {
        var body = req.body;
        var event = new Events(body);

        event.save(function (err, event) {
            if (err) {
                return next(err);
            }

            res.status(200).send({success: 'tracked'})
        });
    };

    this.getStats = function (req, res, next) {
        var data = req.query;


        if (!data.g) {
            return clientList(data, res, next);
        }

        groupedList(data, res, next);

        function clientList (data, res, next) {
            var filter = {
                'country': {
                    $nin: ['UA']
                }
            };
            var query = Events.find(filter, {pass: 0, __v: 0});

            if (data.sort) {
                query.sort(data.sort);
            } else {
                query.sort({"registrationDate": -1});
            }

            query.skip((data.page - 1) * data.count).limit(data.count);

            query.exec(function (err, events) {
                if (err) {
                    return next(err);
                }

                res.status(200).send(events)
            });
        };

        function groupedList (data, res, next) {
            var startDate = data.start;
            var endDate = data.end;
            var zoom = data.z;
            var groupBy = data.g;

            var filter = {
                $match: {
                    'country': {
                        $nin: ['UA']
                    }
                }
            };
            var group = {
                $group: {
                    _id: {
                        country: '$' + groupBy,
                        registrType: '$registrType'
                    },
                    count: {$sum: 1}
                }
            };

            var project = {
                $project: {
                    country: '$_id.country',
                    registrType: '$_id.registrType',
                    count: 1,
                    _id: 0
                }
            };

            var query = Events.aggregate([filter, group, project]);

            query.exec(function (err, events) {
                if (err) {
                    return next(err);
                }

                events = _.groupBy(events, 'country');

                res.status(200).send(events)
            });
        }
    };

    this.getCount = function (req, res, next) {
        var query = req.query;
        var startDate = query.start;
        var endDate = query.end;
        var zoom = query.z;
        var groupBy = query.g;
        var filter = query.filter;

        Events.find({name: 'register', country: {$nin: ['UA']}}).count(function (err, events) {
            if (err) {
                return next(err);
            }

            res.status(200).send({count: events})
        });
    };
};

module.exports = Events;
