const mocha = require('mocha');
const mongoose = require('mongoose');
const expect = require('chai').expect;
const wallet = require('../index');

const handle = mongoose.connect('mongodb://localhost:27017/TestDB');

mongoose.connection.on('connected' , function(){
	console.log('Mongoose connection successfully');
});

mongoose.connection.on('error' , function(err){
	console.log('Mongoose connection error : ' + err);
});

mongoose.connection.on('disconnected' , function(){
	console.log('Mongoose connection disconnected');
});

const Schema = mongoose.Schema;

const deviceSchema = new Schema({
	deviceLibraryIdentifier: String,
	pushToken: String
});

const registrationSchema = new Schema({
	deviceLibraryIdentifier: String,
	passTypeIdentifier: String,
	serialNumber: String
});

const passSchema = new Schema({
	passTypeIdentifier: String,
	serialNumber: String,
	lastUpdated: {type: Number, default: 0},
	userName: String
});

const Device = mongoose.model('Device', deviceSchema);
const Pass = mongoose.model('Pass', passSchema);
const Registration = mongoose.model('Registration', registrationSchema);

const version = 'v1';
const deviceLibraryIdentifier = '';
const passTypeIdentifier = '';
const serialNumber = '';
const pushToken = '';

const now = Date.now();

// POST request to webServiceURL/version/devices/deviceLibraryIdentifier/registrations/passTypeIdentifier/serialNumber
describe('Test registration', function(){
	const req = {};
	req.params = [version, deviceLibraryIdentifier, passTypeIdentifier, serialNumber];
	req.body = {}; req.body.pushToken = pushToken;

	
	before(function(done){
		Device.remove({}, function(err){
			if(err){
				throw err;
			}
			Registration.remove({}, function(err){
				if(err){
					throw err;
				}
				Pass.remove({}, function(err){
					if(err){
						throw err;
					}
					done();
				});
			});
		});
	});

	it('Should return HTTP status 201 if registration succeeds', function(done){
		wallet.register(req, Device, Registration, function(err, status){
			expect(status).to.equal(201);
			done();
		});
	});


	it('Should return HTTP status 200 if serial number is already registered for this device', function(done){
		wallet.register(req, Device, Registration, function(err, status){
			expect(status).to.equal(200);
			done();
		});
	});
});

// GET request to webServiceURL/version/devices/deviceLibraryIdentifier/registrations/passTypeIdentifier?passesUpdatedSince=tag
describe('Test getSerialNumbers', function(){
	const userName = '';
	const req = {};
	req.params = [version, deviceLibraryIdentifier, passTypeIdentifier];
	req.query = {};

	before(function(done){
		const newUser = new Pass({
			passTypeIdentifier: passTypeIdentifier,
			serialNumber: serialNumber,
			lastUpdated: now,
			userName: userName
		});


		newUser.save(newUser, function(err){
			if(err){
				throw err;
			}
				done();
			});
		});
	});

	it('Should return HTTP status 200 with serialNumberList on success', function(done){
		wallet.getSerialNumbers(req, Registration, Pass, function(err, status, responseBody){
			expect(status).to.equal(200);
			expect(responseBody.serialNumbers).to.deep.equal([serialNumber.toString()]);
			expect(responseBody.lastUpdated).to.equal((now + 1).toString());
			done();
		});
	});

	it('Should return HTTP status 200 with empty serialNumberList on success' + 
		'Returns only the passes that have been updated since the time indicated by passesUpdatedSince tag', function(done){
		req.query.passesUpdatedSince = now + 1;
		wallet.getSerialNumbers(req, Registration, Pass, function(err, status, responseBody){
			expect(status).to.equal(200);
			expect(responseBody.serialNumbers).to.deep.equal([]);
			expect(responseBody.lastUpdated).to.equal((now + 1).toString());
			done();
		});
	});

	it('Should return HTTP status 204 for no matching passes', function(done){
		req.query.passesUpdatedSince = 0;
		req.params[1] = '';
		wallet.getSerialNumbers(req, Registration, Pass, function(err, status, responseBody){
			expect(status).to.equal(204);
			done();
		});
	});

	it('Should return HTTP status 200 and serialNumberList on success.' +
		'Returns only the passes that have been updated since the time indicated by passesUpdatedSince tag', function(done){
		req.params[1] = deviceLibraryIdentifier;
		req.query.passesUpdatedSince = (now + 1);

		Pass.update({
			userName : ''
		}, {
			lastUpdated : (now + 20000)
		}, function(err){
			if(err){
				throw err;
			}
				done();
			});
		});

// GET request to webServiceURL/version/passes/passTypeIdentifier/serialNumber
describe('Test getPass', function(){
	const req = {};
	req.params = [version, passTypeIdentifier, serialNumber];

	it('Should return HTTP status code 200 and pass data of John Doe on success', function(done){
		req.headers = {}; req.headers['if-modified-since'] = 0;
		wallet.getPass(req, Pass, function(err, status, passData){
			expect(status).to.equal(200);
			expect(passData.userName).to.equal('');
			done();
		});
	});

	it('Should return HTTP status code 304 as the pass has not changed', function(done){
		req.headers = {}; req.headers['if-modified-since'] = now;
		wallet.getPass(req, Pass, function(err, status, passData){
			expect(status).to.equal(304);
			done();
		});
	});

	it('Should return HTTP status code 500 for invalid serialNumber', function(done){
		req.headers = {}; req.headers['if-modified-since'] = now;
		req.params[1] = '';
		wallet.getPass(req, Pass, function(err, status, passData){
			expect(status).to.equal(500);
			done();
		});
	});
});

// DELETE request to webServiceURL/version/devices/deviceLibraryIdentifier/registrations/passTypeIdentifier/serialNumber
describe('Test unregister', function(){
	const req = {};
	req.params = [version, deviceLibraryIdentifier, passTypeIdentifier, serialNumber];

	// John Doe
	it('Should return HTTP status code 200 if unregistering succeeds', function(done){
		wallet.unregister(req, Registration, Device, function(err, status){
			expect(status).to.equal(200);
			done();
		});
	});

	it('Should return HTTP status code 500 as no entries in registration table', function(done){
		wallet.unregister(req, Registration, Device, function(err, status){
			expect(status).to.equal(500);
			done();
		});
	});
});

// POST request to webServiceURL/version/log
describe('Test log', function(){
	const logs = [''];
	const req = {};
	req.body = {};
	req.body.logs = logs;
	it('Should pass req.body.logs to callback parameter logArray', function(done){
		wallet.log(req, function(err, status, logArray){
			expect(status).to.equal(200);
			expect(logArray).to.deep.equal(logs);
			done();
		});
	});

	after(function(done){
		Device.remove({}, function(err){
			if(err){
				throw err;
			}
			Registration.remove({}, function(err){
				if(err){
					throw err;
				}
				Pass.remove({}, function(err){
					if(err){
						throw err;
					}
					mongoose.connection.db.dropDatabase();
					done();
				});
			});
		});
	});
});



