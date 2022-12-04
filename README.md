# Apple Wallet updating cards.
AppleWallet pushing notifications and updating cards.
__Steps__:

1.Generate a Pass and save user data in the Pass schema

2.Wallet app makes REST calls when user adds Pass to the wallet app

3.Wallet requests -> Authenticate -> wallet-mongoose

## Installation
`$ npm install applewallet`

**Usage** :

__Sample schema with mandatory fields,__
~~~~
var deviceSchema = new Schema({
	deviceLibraryIdentifier : String,
	pushToken : String
});

var registrationSchema = new Schema({
	deviceLibraryIdentifier : String,
	passTypeIdentifier : String,
	serialNumber : String
});

var passSchema = new Schema({
	passTypeIdentifier : String,
	serialNumber : String,
	lastUpdated : {type : Number , default : 0}, // This can be UNIX time
	userName : String	// (Optional) Add in your custom fields for storing user data
});

var Device = mongoose.model('Device' , deviceSchema);
var Pass = mongoose.model('Pass' , passSchema);
var Registration = mongoose.model('Registration' , registrationSchema);
~~~~

__Generate Pass:__

Generate a Pass using any pass generating module and save the document in the Pass schema.

On clicking Add pass to the wallet app, the following REST calls are used by the wallet app.

__REST API's:__

1.Register
~~~~
var express = require('express');
var router = express.Router();
var authenticate = require('./authenticate'); // Plug in your authentication module, using jsonwebtoken for instance
var wallet = require('wallet-mongoose');

router.post('/webServiceURL/*/devices/*/registrations/*/*', authenticate.verify, function(req, res, next){
	wallet.register(req, Device, Registration, function(err, statusCode){
		if(err){
			res.sendStatus(statusCode);	// Send appropriate error status code
		}
		res.sendStatus(statusCode);	// Send appropriate success status code
	});
});
~~~~

2.Get Serial Numbers
~~~~
router.get('/webServiceURL/*/devices/*/registrations/*', function(req, res, next){
	wallet.getSerialNumbers(req, Registration, Pass, function(err, statusCode, responseBody){
		if(err){
			res.sendStatus(statusCode);
		}
		res.status(statusCode).send(responseBody);
	});
});
~~~~

3.Get Pass
~~~~
router.get('/webServiceURL/*/passes/*/*', authenticate.verify , function(req, res, next){
	wallet.getPass(req, Pass, function(err, statusCode, passData){
		if(err){
			res.sendStatus(statusCode);
		}
		// passData is the document in the Pass schema holding user's data
		/*
		 Call next module which uses passData and generates an actual Pass
		 The passbook module for example is capable of doing this
	 	*/
	 	next();
	});
});
~~~~

4.Unregister
~~~~
router.delete('/webServiceURL/*/devices/*/registrations/*/*' , authenticate.verify, function(req, res, next){
	wallet.unregister(req, Registration, Device, function(err, statusCode){
		if(err){
			res.sendStatus(statusCode);
		}
		res.sendStatus(statusCode);
	});
});
~~~~

5.Log
~~~~
router.post('/webServiceURL/*/log' , function(req, res, next){
	wallet.log(function(err, statusCode, log){
		console.log(log);	// Just logs to console
		res.sendStatus(statusCode);
	});
});
~~~~

__Testing__

Run mongod on mongodb://localhost:27017, then
~~~~
cd applewallet
npm install
npm test
~~~~

