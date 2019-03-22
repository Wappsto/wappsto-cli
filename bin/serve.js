#!/usr/bin/env node

const zlib = require('zlib');
const express = require('express');
const proxy = require('http-proxy-middleware');
const cookieParser = require('cookie-parser')
const Wapp = require('../lib/wapp');
const tui = require('../lib/tui');
const Config = require('../lib/config');

const app = express();
const wapp = new Wapp();

const port = Config.port();
let sessionID = '';

if (!wapp.present()) {
    tui.showError('No Wapp found in current folder');
    process.exit(-1);
}

const run = async () => {
    try {
        await wapp.init();
        sessionID = await wapp.getInstallationSession();
        await wapp.openStream((session) => {
            sessionID = session;
        });
    } catch (err) {
        if (err.message === 'LoginError') {
            tui.showError('Failed to Login, please try again.');
        } else {
            console.log(err);
            console.log('Run error');
        }
        process.exit(-1);
    }
};
run();

const { HOST } = wapp.wappsto;

app.use('/services', proxy({
    target: HOST,
    changeOrigin: true,
    ws: true,
    logLevel: 'error',
}));

// need cookieParser middleware before we can do anything with cookies
app.use(cookieParser());

// set a cookie
app.use(function (req, res, next) {
    res.cookie('sessionID', sessionID, { maxAge: 900000 });
    next();
});

app.use(express.static('foreground'));

app.listen(port, () => tui.showMessage(`Wapp is running on port ${port}!`));
