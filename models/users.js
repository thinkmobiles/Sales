/**
 * Created by Roman on 17.04.2015.
 */
module.exports = (function () {
    var mongoose = require('mongoose');

    var UsersSchema = mongoose.Schema({
        pass: {type: String, default: ''},
        login: {type: String, default: ''},
        loggedIn: {type: Date, default: Date.now}
    }, {collection: 'users'});

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas['Users'] = UsersSchema;
})();