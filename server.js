const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: "false" }));
app.use(bodyParser.json());

app.use(cors())
app.use(express.static('public'))

const { Schema } = mongoose;

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new Schema({
	username: {
		type: String,
		required: [true, 'Username required.']
	}
});

const exerciseSchema = new Schema({
	username: {
		type: String,
		required: [true, 'Username required.']
	},
	description: {
		type: String,
		required: [true, 'Description required.']
	},
	duration: {
		type: Number,
		required: [true, 'Duration required.']
	},
	date: {
		type: String,
		validate: {
			validator: function(v) {
				return /\d{4}-\d{2}-\d{2}/.test(v);
			},
			message: props => `${props.value} is not a valid date.`
		}
	}
});

const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', function(req, res) {
	let user = new User({ username: req.body.username });
	user.save((err, data) => {
		if (err) {
			console.error(err);
			return res.json(err);
		}
		res.json({ username: data.username, _id: data._id });
	});
});

app.get('/api/users', function(req, res) {
	User.find({}, (err, data) => {
		if (err) {
			console.error(err);
			return res.json(err);
		}
		if (data) {
			return res.json(data);
		}
	})
});

app.post('/api/users/:id/exercises', function(req, res) {
	User.findOne({ _id: req.params.id }, (err, userData) => {
		if (err) {
			console.error(err);
			return res.json(err);
		}
		if (userData) {
			let reqDate = req.body.date;
			console.log(reqDate);
			if (reqDate == null || reqDate == '') {
				console.log('Default Req Date');
				let date = new Date();
				let year = date.getFullYear();
				let month = date.getMonth() + 1;
				if (month < 10) month = `0${month}`;
				let day = date.getDate();
				if (day < 10) day = `0${day}`;

				reqDate = `${year}-${month}-${day}`;
			}

			let exercise = new Exercise({
				username: userData.username,
				description: req.body.description,
				duration: req.body.duration,
				date: reqDate,
			});
			exercise.save((err, data) => {
				if (err) {
					console.error(err);
					return res.json(err);
				}
				res.json({
					username: data.username,
					description: data.description,
					duration: data.duration,
					date: new Date(data.date).toDateString(),
					_id: userData._id
				});
			});
		} else {
			return res.json({ error: 'No username found.' });
		}
	});
});

app.get('/api/users/:id/logs', function(req, res) {
	User.findById(req.params.id, (err, userData) => {
		if (err) {
			console.error(err);
			return res.json(err);
		}

		let query = {};
		query.username = userData.username;
		if (req.query.from) query.date = { $gte: req.query.from };
		if (req.query.to) query.date = { $lte: req.query.to };
		if (req.query.from && req.query.to) query.date = { $gte: req.query.from, $lte: req.query.to };

		let options = {};
		if (req.query.limit) options = { limit: req.query.limit };
		
		Exercise.find(query, '-_id description duration date', options, (err, exerciseData) => {
			if (err) {
				console.error(err);
				return res.json(err);
			}
			if (exerciseData) {
				let exerciseWithDateModified = exerciseData.map(element => {
					element.date = new Date(element.date).toDateString();
					return element;
				});
				return res.json({
					username: userData.username,
					count: exerciseData.length,
					_id: userData._id,
					log: exerciseWithDateModified
				})
			} else {
				return res.json({ error: 'Id not found.' });
			}
			return res.json(exerciseData);
		});
	});
});

app.use((err, req, res, next) => {
	try {
		console.log('ERROR');
		console.log(err);
	} catch (err) {
		res.status(500).send('Unknown error');
	}
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
