const config = exports.config = require('./../config.json');

const http = require('http');
const favicon = require('serve-favicon');
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const DiscordS = require('passport-discord').Strategy;
const bodyParser = require('body-parser');
const nodemon = require('nodemon');
const mysql = require('mysql');

const app = exports.app = express();
let connection;

const bot = exports.bot = require('./modules/bot/bot');
const auth = exports.auth = require('./modules/auth');
const read = exports.read = require('./modules/read');

try {

    connection = exports.db = mysql.createConnection({
        host: config.sql_host,
        user: config.sql_user,
        password: config.sql_pass,
        database: config.sql_db
    });

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(express.static('Web'));
    app.set('views', `${__dirname}/Views`);
    app.set('view engine', 'ejs');
    app.use('/', express.static(`${__dirname}/Static`));
    app.use(session({
        secret: config.session_secret,
        resave: true,
        saveUninitialized: false
    }));
}catch (err){
    console.error(`An error occurred during Web initialisation, Error: ${err.stack}`);
}

// Set up modules
try {
    //bot.connect();
    auth(config, app, passport, DiscordS);
    read(app, config);

}catch (err) {
    console.error(`An error occurred during module initialisation, Error: ${err.stack}`);
}

// Set up final server
try {
    const httpServer = http.createServer(app);
    httpServer.listen(config.server_port, (err) => {
        if (err) {
            console.error(`FAILED TO OPEN WEB SERVER, ERROR: ${err.stack}`);
            return;
        }
        console.info(`Successfully started server..listening on port ${config.server_port}`);
    })
}catch (err){
    console.error(`Error starting up server, Error: ${err.stack}`)
}

process.on('uncaughtException', (err) => {
    let errorMsg = err.stack.replace(new RegExp(`${__dirname}\/`, 'g'), './');
    console.error('Uncaught Exception' + errorMsg);
});

