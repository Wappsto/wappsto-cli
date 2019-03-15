#!/usr/bin/env node

const zlib = require('zlib');
const express = require('express');
const proxy = require('http-proxy-middleware');
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

app.use('/wapp-api.js', proxy({
    target: `https://light.${HOST.split('//')[1]}`,
    changeOrigin: true,
    logLevel: 'error',
    onProxyRes: (proxyRes, req, res) => {
        let originalBody = Buffer.from([]);
        proxyRes.on('data', (data) => {
            originalBody = Buffer.concat([originalBody, data]);
        });

        proxyRes.on('end', () => {
            const bodyString = zlib.gunzipSync(originalBody).toString('utf8');
            const newBody = `sessionStorage.setItem('sessionID', '${sessionID}');\n${bodyString}`;

            res.set({
                'Set-Cookie': `x-session=${sessionID}`,
                'content-type': 'text/html; charset=utf-8',
                'content-encoding': 'gzip',
            });
            res.write(zlib.gzipSync(newBody));
            res.end();
        });
    },
    selfHandleResponse: true,
}));

app.use(express.static('foreground'));

app.listen(port, () => tui.showMessage(`Wapp is running on port ${port}!`));
