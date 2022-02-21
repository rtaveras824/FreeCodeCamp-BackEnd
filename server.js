require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { Schema } = mongoose;
const dns = require('dns');

let count = 0;

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const urlSchema = new Schema({
	original_url: {
		type: String,
		required: true,
		unique: true
	},
	short_url: {
		type: Number,
		required: true,
		unique: true
	}
});

const URL = mongoose.model('Url', urlSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', function(req, res, next) {
	let newUrl = req.body.url;
	const regex = /^http:\/\/(www\.)*|^https:\/\/(www\.)*/;

	let validUrl = regex.test(newUrl);

	if (validUrl) {
		hostName = newUrl.replace(regex, "");

		dns.lookup(hostName, (err, addr, family) => {
			if (err) {
				res.send(err);
				next();
			}

			let urlData = { original_url: newUrl, short_url: ++count };
			let url = new URL(urlData);
			url.save((err, data) => {
				if (err) {
					res.json(err);
					console.log(err);
					next();
				}
				res.json(urlData);
			});
		});
	} else {
		res.json({ error: "invalid url" });
	}
	
});

app.get('/api/shorturl/:code', function(req, res) {
	URL.findOne({ short_url: req.params.code }, (err, data) => {
		if (err) {
			res.send(err);
		}
		res.redirect(data.original_url);
	});
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
