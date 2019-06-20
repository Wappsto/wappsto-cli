#!/usr/bin/env node

const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws').Server;
const httpProxy = require('http-proxy');

const Wapp = require('../lib/wapp');
const Config = require('../lib/config');
const tui = require('../lib/tui');

const wss = new WebSocket({ noServer: true });
const wapp = new Wapp();
const proxy = httpProxy.createProxyServer({
    target: wapp.host,
    agent: https.globalAgent,
    headers: { host: url.parse(wapp.host).host },
});

if (!wapp.present()) {
    tui.showError('No Wapp found in current folder');
    process.exit(-1);
}

let sessionID;
let fileHtml;

function getFileHtml() {
    const index = path.join(Config.foreground(), 'index.html');
    if (!fs.existsSync(index)) {
        tui.showError(`File '${index}' not found.`);
        process.exit(-1);
    }
    return fs.readFileSync(index, 'utf-8');
}

function startServer() {
    const server = http.createServer((req, res) => {
        switch (req.url.split('/')[1]) {
        case 'services':
            proxy.web(req, res);
            break;
        case '':
            res.writeHead(200, {
                'Content-Type': 'text/html',
                'Set-Cookie': `sessionID=${sessionID}`,
            });
            res.end(fileHtml, 'utf-8');
            break;
        default:
            try {
                res.writeHead(200);
                const file = fs.readFileSync(path.join(Config.foreground(), req.url));
                res.end(file, 'utf-8');
            } catch (err) {
                res.writeHead(404);
                res.end();
            }
            break;
        }
    });

    server.on('upgrade', (req, socket, head) => {
        if (req.url.split('/')[1] === 'autoReload') {
            wss.handleUpgrade(req, socket, head, (ws) => {
                wss.emit('connection', ws, req);
            });
        } else {
            proxy.ws(req, socket, head);
        }
    });

    tui.showMessage(`Foreground Wapp is running on port ${Config.port()}!`);

    server.listen(Config.port());
}

(async () => {
    try {
        fileHtml = getFileHtml();
        await wapp.init();
        sessionID = await wapp.getInstallationSession();
        await wapp.openStream();
        startServer();
    } catch (err) {
        if (err.message === 'LoginError') {
            tui.showError('Failed to Login, please try again.');
        } else {
            console.log(err);
            console.log('Run error');
        }
        process.exit(-1);
    }
})();
