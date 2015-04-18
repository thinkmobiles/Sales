/**
 * Created by Roman on 05.04.2015.
 */
module.exports = (function () {
    var mongoose = require('mongoose');

    var EvantsSchema = mongoose.Schema({
        date: {type: Date, default: Date.now},
        ip: String,
        email:String,
        country: String,
        city: String,
        region: String,
        subDomainName: String,
        name: {type: String, default: ''},
        registrType: {type: String, default: 'demo'},
        status: {type: Number, default: 500},
        message: String
    }, {collection: 'events'});

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas['Events'] = EvantsSchema;
})();