#!/usr/bin/env node

const express = require('express');
const proxy = require('http-proxy-middleware');
const Wapp = require('../lib/wapp');
const tui = require('../lib/tui');
const Config = require('../lib/config');

const app = express();
const wapp = new Wapp();

const HOST = wapp.host;
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

app.use('/services', proxy({
    target: HOST,
    changeOrigin: true,
    ws: true,
    logLevel: 'error',
}));

// set a cookie
app.use((req, res, next) => {
    res.cookie('sessionID', sessionID, { maxAge: 900000 });
    next();
});

app.use(express.static(Config.foreground()));

app.listen(port, () => tui.showMessage(`Foreground Wapp is running on port ${port}!`));
