const express = require('express');
const fetch = require('node-fetch');
const redis = require('redis');

// Port 
const PORT = process.env.PORT || 5000;

const client = redis.createClient();

client.on('connect', ()=>{
    console.log('Connected to Redis!');
});

client.on('error', ()=>{
    console.log('Lost Connection to Redis');
});

const app = express();

// Make request to Github for number of repos  
async function getReposCount(req, res, next) {
    try {
        console.log('Fetching data...');
        const { username } = req.params;
        console.log('Username is : ', username);
        const response = await fetch(`https://api.github.com/users/${username}`);
        const data = await response.json();
        const repos = data.public_repos;
        client.setex(username, 3600, repos);
        res.send(setResponse(username, repos));
    } catch (err) {
        console.error(err);
        res.status(500);
    }
}

// Set Response
function setResponse(username, repos) {
    return `<h2>${username} has ${repos} Github Repos</h2>`;
}

// Cache Middleware
function cache(req, res, next) {
    const { username } = req.params;

    console.log('Fetching from Cache...');
    client.get(username, (err, data) => {
        if(err) {
            throw err;
        } else if (data !== null) {
            res.send(setResponse(username, data));
        } else {
            next();
        }
    })
}

app.get('/', (req, res, next) => {
    res.send('Welcome to the Redis Node Cache app!!');
})

app.get('/repos/:username', cache, getReposCount);

app.listen(PORT, ()=>{
    console.log(`Listening on port ${PORT}`);
});
