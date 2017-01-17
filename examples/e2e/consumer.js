const express = require('express');
const request = require('superagent-bluebird-promise');
const server = express();
const API_HOST = process.env.API_HOST;

const availableAnimals = () => {
	return request
		.get(`${API_HOST}/animals/available`)
		.then(res => res.body,
				  err => []);
}

// Suggestions function:
// Given availability and sex etc. find available suitors.
const suggestion = (animal) => {
	const predicates = [
		((candidate, animal) => candidate.id != animal.id),
		((candidate, animal) => candidate.gender != animal.gender),
		((candidate, animal) => candidate.animal == animal.animal)
	]
	
	let weights = [
		((candidate, animal) => Math.abs(candidate.age - animal.age))
	]
	
	return availableAnimals().then(available => {
		const eligible = available.filter(a => !predicates.map(p => p(a, animal)).includes(false));
		
		return eligible.map(candidate => {
			let score = weights.reduce((acc, weight) => {
				return acc - weight(candidate, animal);
			}, 100);
			
			return {
				"score": score,
				"animal": candidate
			}
		});
	});
}

// API
server.get('/suggestions/:animalId', (req, res) => {
	if (!req.params.animalId) {
		res.writeHead(400);
		res.end();
	}
	
	request(`${API_HOST}/animals/${req.params.animalId}`, (err, r, body) => {
	  if (!err && r.statusCode == 200) {
			suggestion(r.body).then(suggestions => {
				res.json(suggestions);
			})
	  } else if (r.statusCode == 404){
			res.writeHead(404);
			res.end();
	  } else {
			res.writeHead(500);
			res.end();
		}
	});
});

module.exports = server;
