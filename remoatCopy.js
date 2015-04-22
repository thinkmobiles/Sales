// JavaScript source code
var mongoose = require('mongoose');
var client
var remoat = mongoose.createConnection('5.189.142.175', 'mainDB');
remoat.once('connected', function () {
    console.log('connected to mainDB on 5.189.142.175');

    var local = mongoose.createConnection('192.168.88.250', 'salesDb');
    local.once('connected', function () {
        var SaasSchema = mongoose.Schema({
            _id: String,
            registrationDate: { type: Date, default: Date.now },
            ip: String,
            geo: JSON,
            url: { type: String, default: 'localhost' },
            DBname: { type: String, default: '' },
            users: [{
                registrationDate: { type: Date, default: Date.now },
                pass: { type: String, default: '' },
                user: { type: String, default: '' },
                forgotToken: { type: String, default: '' }
            }]
        }, { collection: 'SaasDbs' });

        var EvantsSchema = mongoose.Schema({
            date: { type: Date, default: Date.now },
            ip: String,
            email: String,
            country: String,
            city: String,
            region: String,
            subDomainName: String,
            name: { type: String, default: '' },
            registrType: { type: String, default: 'demo' },
            status: { type: Number, default: 500 },
            message: String
        }, { collection: 'events' });

        var RemoatSaas = remoat.model('Saas', SaasSchema);
        var Events = local.model('events', EvantsSchema);


        RemoatSaas.find({}, function (err, resp) {
            if (err) {
                console.error(err);
            } else {
                
                resp.forEach(function (saas) {
                    var saveObject = {
                        ip: saas.ip,
                        country: (saas.geo) ? saas.geo.country : undefined,
                        city: (saas.geo) ? saas.geo.city : undefined,
                        region: (saas.region) ? saas.geo.region : undefined,
                        subDomainName: saas.DBname,
                        name: 'register',
                        registrType: 'saasTrial',
                        status: 201
                    };

                    saas.users.forEach(function (user) {
                        saveObject.date = user.registrationDate;
                        saveObject.email = user.user;

                        var event = new Events(saveObject);
                        event.save(function (err, res) {
                            console.log(err);
                        });
                    });
                });
            }
        });
    });
    local.on('error', function (err) {
        console.error(err);
    });
});
remoat.on('error', function (err) {
    console.error(err);
});

//var ObjectId = mongoose.Schema.Types.ObjectId;

//var moduleSchema = mongoose.Schema({
//    _id: Number,
//    mname: String,
//    href: { type: String, default: '' },
//    sequence: Number,
//    parrent: Number,
//    link: Boolean,
//    visible: Boolean
//}, { collection: 'modules' });


//var module = mongoose.model('modules', moduleSchema);

//var moduleTree = [{
//    _id: 54,
//    sequence: 54,
//    parrent: null,
//    href: 'Payments',
//    mname: 'Payments',

//}];

//module.find({}, function (err, res) {
    
//});// JavaScript source code
