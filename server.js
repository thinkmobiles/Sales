var mongoose = require('mongoose');
var mainAppConfig = require('./config/main').mainApp;
var dbsObject = {};
var dbsNames = {};
//var subdomain = require('express-subdomain');
var mainDb = mongoose.createConnection('localhost', 'mainDB');
//var sessionParser = require('./helpers/sessionParser');

require('./config/' + mainAppConfig.NODE_ENV);
process.env.NODE_ENV = mainAppConfig.NODE_ENV;

mainDb.on('error', console.error.bind(console, 'connection error:'));
mainDb.once('open', function callback () {
    mainDb.dbsObject = dbsObject;
    console.log("Connection to mainDB is success");

    require('./models/index.js');

    var SaasSchema = mongoose.Schemas['Saas'];
    var Saas = mainDb.model('Saas', SaasSchema);

    var sessionSchema = mongoose.Schema({
        _id: String,
        session: String,
        expires: Date
    }, {collection: 'sessions'});


    var main = mainDb.model('sessions', sessionSchema);
    var app;
    var port = process.env.PORT || 8091;

    app = require('./app')(mainDb);


    app.listen(port, function () {
        console.log('==============================================================');
        console.log('|| server start success on port=' + port + ' in ' + process.env.NODE_ENV + ' version ||');
        console.log('==============================================================\n');
    });
});

