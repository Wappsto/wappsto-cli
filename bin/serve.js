#!/usr/bin/env node

const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');
const url = require('url');
const fs = require('fs');
const path = require('path');
const watch = require('node-watch');
const detect = require('detect-port');
const bs = require('browser-sync').create();
const { createProxyMiddleware } = require('http-proxy-middleware');

const Wapp = require('../lib/wapp');
const Config = require('../lib/config');
const tui = require('../lib/tui');
const files = require('../lib/files');

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

function isForegroundPresent() {
    const index = path.join(Config.foreground(), 'index.html');
    if (!fs.existsSync(index)) {
        tui.showWarning(`File '${index}' not found.`);
        return false;
    }
    return true;
}

async function startServer(sessionID) {
    const port = options.port || Config.port();
    const newPort = await detect(port);

    if (port !== newPort) {
        tui.showWarning(`${port} is in use, switching to ${newPort}`);
    }

    function fileExists(dir, request) {
        const baseDir = dir.split('/');
        baseDir.reverse();
        for (let i = 0, len = baseDir.length; i < len; i += 1) {
            const uri = url.parse(request.url).pathname;
            const filename = path.join(process.cwd(), baseDir[i], uri);

            const index = '/index.html';

            if (files.directoryExists(filename)) {
                if (files.fileExists(fs.statSync(filename + index))) {
                    request.url += index;
                    return true;
                }
            } else if (files.fileExists(filename)) {
                return true;
            }
        }
        return false;
    }

    const proxy = createProxyMiddleware('/services', {
        target: `${Config.host()}`,
        changeOrigin: true,
        logLevel: 'silent',
        ws: true, // proxy websockets
        onError(err) {
            tui.showError(err);
        },
        onProxyReq(proxyReq, req) {
            req.headers['x-session'] = sessionID;
            if (req.headers && req.headers.referer) {
                req.headers.referer = req.headers.referer.replace(`http://localhost:${newPort}`, `${Config.host()}`);
            }
        },
        onProxyRes(proxyRes) {
            if (proxyRes.headers && proxyRes.headers.location) {
                // eslint-disable-next-line no-param-reassign
                proxyRes.headers.location = proxyRes.headers.location.replace(Config.host(), `http://localhost:${newPort}`);
            }
        },
    });

    const server = {
        baseDir: Config.foreground(),
        middleware: [
            function localServe(request, response, next) {
                response.setHeader('set-cookie', `sessionID=${sessionID}`);
                // check if requested file exists locally
                if (fileExists(Config.foreground(), request)) {
                    next();
                } else {
                    proxy(request, response, next);
                }
            },
        ],
    };

    // .init starts the server
    bs.init({
        logPrefix: 'Wappsto Cli',
        port: newPort,
        ui: false,
        server,
        files: `${Config.foreground()}/*`,
    });
}

(async () => {
    try {
        /*
        const { childProcess, versionRange, version } = await nvexeca('8', 'node', [
            '--version',
        ]);
        console.log(`Node ${versionRange} (${version})`); // Node 8 (8.16.2)
        const { exitCode, stdout, stderr } = await childProcess;
        console.log(`Exit code: ${exitCode}`); // 0
        console.log(stdout); // v8.16.2
*/
        await wapp.init();
        const sessionID = await wapp.getInstallationSession();
        await wapp.openStream();

        const hasForeground = isForegroundPresent();
        if (hasForeground) {
            startServer(sessionID);
        } else {
            tui.showWarning('No foreground files found, local webserver is not started');
        }

        watch(Config.background(), { recursive: true }, (evt, name) => {
            wapp.uploadFile(name);
        });
    } catch (err) {
        if (err.message === 'LoginError') {
            tui.showError('Failed to Login, please try again.');
        } else {
            tui.showError('Run error', err);
        }
        process.exit(-1);
    }
})();
