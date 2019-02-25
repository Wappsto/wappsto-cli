#!/usr/bin/env node

const zlib = require('zlib');
const express = require('express');
const proxy = require('http-proxy-middleware');
const Wapp = require('../lib/wapp');
const tui = require('../lib/tui');

const app = express();
const wapp = new Wapp();

const port = 3000;
let sessionID = '';

if (!wapp.present()) {
    tui.showError('No Wapp found in current folder');
    process.exit(-1);
}

const run = async () => {
    try {
        await wapp.init();
        sessionID = await wapp.getInstallationSession();
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

const HOST = wapp.wappsto.HOST;

app.use('/services', proxy({
    target: HOST,
    changeOrigin: true,
    ws: true,
    logLevel: 'debug',
}));

app.use('/wapp-api.js', proxy({
    target: `https://light.${HOST.split('//')[1]}`,
    changeOrigin: true,
    logLevel: 'debug',
    onProxyRes: (proxyRes, req, res) => {
        let originalBody = Buffer.from([]);
        proxyRes.on('data', (data) => {
            originalBody = Buffer.concat([originalBody, data]);
        });

        proxyRes.on('end', () => {
            const bodyString = zlib.gunzipSync(originalBody).toString('utf8');
            const newBody = `window.sessionID = '${sessionID}';\n${bodyString}`;

            res.set({
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

app.listen(port, () => console.log(`Wapp is running on port ${port}!`));
