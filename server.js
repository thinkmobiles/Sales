var mongoose = require('mongoose');
var mainAppConfig = require('./config/main').mainApp;
var mainDb = mongoose.createConnection('localhost', 'salesDb');
//var sessionParser = require('./helpers/sessionParser');

require('./config/' + mainAppConfig.NODE_ENV);
process.env.NODE_ENV = mainAppConfig.NODE_ENV;

mainDb.on('error', console.error.bind(console, 'connection error:'));
mainDb.once('open', function callback () {
    var app;
    var port = process.env.PORT || 8091;

    console.log("Connection to mainDB is success");

    require('./models/index.js');

    app = require('./app')(mainDb);


    app.listen(port, function () {
        console.log('==============================================================');
        console.log('|| server start success on port=' + port + ' in ' + process.env.NODE_ENV + ' version ||');
        console.log('==============================================================\n');
    });
});

