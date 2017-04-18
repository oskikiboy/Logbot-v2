const requestify = require('requestify');
const utils = require('./../utils');
const botUtils = require('./bot/botUtils');
const fs = require('fs');

module.exports = function (app, config) {

    app.use(function (req, res, next) {
        req.session.redirect = req.path || '/';
        next();
    });

    app.get('/', (req, res) => {
        try {
            res.render('index', {
                loggedInStatus: req.isAuthenticated(),
                userRequest: req.user || false
            })
        } catch (err) {
            renderErrorPage(req, res, err);
        }
    });

    app.get('/servers', (req, res) => {
        try {
            let visibleGuilds = utils.getUserVisibleGuilds();

            res.render('servers', {
                visibleServers: JSON.stringify(visibleGuilds),
                loggedInStatus: req.isAuthenticated(),
                userRequest: req.user || false
            })
        } catch (err) {
            renderErrorPage(req, res, err);
        }
    });

    app.get('/servers/:id', (req, res) => {
        let id = req.params.id;

        requestify.get(`${config.host}/api/read?serverid=${id}`).then(response => {
            try {
                let body = JSON.stringify(response.body);
                let guildChannels = JSON.stringify(botUtils.getGuildChannels(id));

                res.render('serverMsg', {
                    serverMessages: body,
                    guildName: botUtils.getGuildNameFromId(id),
                    guildChannels: guildChannels,
                    guildChannelsLength: botUtils.getGuildChannels(id).length,
                    loggedInStatus: req.isAuthenticated(),
                    userRequest: req.user || false
                })

            } catch (err) {
                console.error(`An error has occurred trying to parse body, Error: ${err.stack}`);
                renderErrorPage(req, res, err);
            }
        })
    })

};

function checkAuth(req, res, next) {
    try {

        if (req.isAuthenticated()) return next();

        req.session.redirect = req.path;
        res.status(403);
        res.render('badlogin', {});
    } catch (err) {
        renderErrorPage(req, res, err);
    }
}

function renderErrorPage(req, res, err) {

    console.error(`An error has occurred in Web.js, Error: ${err.stack}`);
    if (err) {
        res.render('error', {
            userRequest: req.user || false,
            error_code: 500,
            error_text: err
        })
    } else {
        res.render('error', {
            userRequest: req.user || false,
            error_code: 500,
            error_text: 'An unknown error has occurred!'
        })
    }
}