// server.js
// where your node app starts

// init project
var express = require('express');
var app = express();

var port = process.env.PORT || 3000;

// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC 
var cors = require('cors');
app.use(cors({optionsSuccessStatus: 200}));  // some legacy browsers choke on 204

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});


// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

app.get("/api/whoami", function(req, res) {
	console.log(req.headers);
	console.log(req.ip);
	res.json({
		ipaddress: req.ip,
		language: req.headers['accept-language'],
		software: req.headers['user-agent']
	});
});

app.get("/api", function (req, res) {
	var date = new Date();
	res.json({ unix: date.valueOf(), utc: date.toUTCString() });
});

app.get("/api/:date", function (req, res) {
	var dateArg;

	if (!isNaN(req.params.date)) {
		dateArg = parseInt(req.params.date)
	} else {
		dateArg = req.params.date;
	}
	
	var date = new Date(dateArg);
	if (date == null || date == 'Invalid Date') {
		res.json({ error: 'Invalid Date' });
	} else {
		res.json({ unix: date.valueOf(), utc: date.toUTCString() });
	}
});



// listen for requests :)
var listener = app.listen(port, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
