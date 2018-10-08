/*
    Node express entry point
*/

// Config imports
const env_config = require('./config/env_config.js');
require('./config/db_connect.js');

// Service package imports
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
var expressStaticGzip = require("express-static-gzip");
const session = require('express-session');
var MongoDBStore = require('connect-mongodb-session')(session);

// Route imports
const application = require('./routes/application');
const google_oauth = require('./routes/google_oauth');

var app = express();
app.set('trust proxy', true);

//Session storage settings
var store = new MongoDBStore({
    uri: process.env.MONGO_URL,
    databaseName: 'pve-application',
    collection: 'mySessions'
});

store.on('error', function(error) {
    throw error;
});

app.use(session({
    secret: process.env.sessionSecret,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    },
    store: store,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: env_config.env != 'development' }
}));

// Middleware
// Parse requests as json and encode urls
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/", expressStaticGzip("./public"));

// Expose public sources
//app.use(express.static(__dirname + './public'));

// Register application routes
app.use(google_oauth);
app.use(application);

// Static routes
app.get('/error', (req, res) => {
    res.send('Something went wrong.');
});

app.get('/*', (req, res) => {
    res.sendFile(path.resolve('./public', 'index.html'));
})

// Initialize server
if(env_config.env == 'development'){
	require('./config/development.js').createDevServer(app).listen(process.env.PORT, () => {
        console.log("Development server started at " + process.env.PORT);
    });
}else{
	app.listen(process.env.PORT, '0.0.0.0', () => {
	    console.log('Started on port ', process.env.PORT);
	});
}