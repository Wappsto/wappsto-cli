#!/usr/bin/env node

const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');
const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');
const watch = require('node-watch');
const WebSocket = require('ws').Server;
const httpProxy = require('http-proxy');

const Wapp = require('../lib/wapp');
const Config = require('../lib/config');
const tui = require('../lib/tui');

const optionDefinitions = [
    {
        name: 'help',
        description: 'Display this usage guide.',
        alias: 'h',
        type: Boolean,
    },
    {
        name: 'port',
        description: 'Change the port that the foreground wapp is served on.',
        alias: 'p',
        type: Number,
    },
    {
        name: 'verbose',
        description: 'Enable verbose output.',
        alias: 'v',
        type: Boolean,
    },
];

const sections = [
    {
        header: 'Serve Wapp',
        content: 'Script to run a local web server for the foreground part of the wapp and opens a stream to the background wapp running on Wappsto.',
    },
    {
        header: 'Synopsis',
        content: [
            '$ serve-wapp',
            '$ serve-wapp {bold --port 4000} {bold --verbose}',
            '$ serve-wapp {bold --help}',
        ],
    },
    {
        header: 'Options',
        optionList: optionDefinitions,
    },
    {
        content: 'Project home: {underline https://github.com/wappsto/wappsto-cli}',
    },
];

const options = commandLineArgs(optionDefinitions);

if (options.help) {
    process.stdout.write(commandLineUsage(sections));
    process.exit();
}

const wapp = new Wapp(options.verbose);

if (!wapp.present()) {
    tui.showError('No Wapp found in current folder');
    process.exit(-1);
}

const wss = new WebSocket({ noServer: true });
const proxy = httpProxy.createProxyServer({
    target: wapp.host,
    agent: https.globalAgent,
    headers: { host: url.parse(wapp.host).host },
});

function getFileHtml() {
    const index = path.join(Config.foreground(), 'index.html');
    if (!fs.existsSync(index)) {
        tui.showWarning(`File '${index}' not found.`);
        return false;
    }
    return fs.readFileSync(index, 'utf-8');
}

function startServer(sessionID, index) {
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
            res.end(index, 'utf-8');
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

    tui.showMessage(`Foreground Wapp is running on port ${options.port || Config.port()}!`);

    server.listen(options.port || Config.port());
}

(async () => {
    try {
        await wapp.init();
        const sessionID = await wapp.getInstallationSession();
        await wapp.openStream();

        let fileHtml = getFileHtml();
        if (!fileHtml) {
            fileHtml = 'NO FOREGROUND!';
        }

        watch(Config.background(), { recursive: true }, (evt, name) => {
            wapp.uploadFile(name);
        });

        startServer(sessionID, fileHtml);
    } catch (err) {
        if (err.message === 'LoginError') {
            tui.showError('Failed to Login, please try again.');
        } else {
            tui.showError('Run error', err);
        }
        process.exit(-1);
    }
})();
