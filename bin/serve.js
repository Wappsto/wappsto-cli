#!/usr/bin/env node

const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');
const url = require('url');
const fs = require('fs');
const path = require('path');
const watch = require('node-watch');
const detect = require('detect-port');
const { spawn } = require('child_process');
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

function isBackgroundPresent() {
  const index = path.join(Config.background(), 'main.js');
  if (!fs.existsSync(index)) {
    tui.showWarning(`File '${index}' not found.`);
    return false;
  }
  return true;
}

async function startServer(sessionID, tokenID) {
  const port = options.port || Config.port();
  const newPort = await detect(port);

  if (port !== newPort) {
    tui.showWarning(`${port} is in use, switching to ${newPort}`);
  }

  function fileExists(dir, request) {
    const uri = url.parse(request.url).pathname;
    const filename = path.join(process.cwd(), dir, uri);
    const index = 'index.html';

    if (files.directoryExists(filename)) {
      if (files.fileExists(fs.statSync(filename + index))) {
        if (request.url.endWith() !== '/') {
          request.url += '/';
        }
        request.url += index;
        return true;
      }
    } else if (files.fileExists(filename)) {
      return true;
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
      req.headers.tokenID = tokenID;
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
        response.setHeader('set-cookie', `tokenID=${tokenID}`);
        try {
          // check if requested file exists locally
          if (fileExists(Config.foreground(), request)) {
            next();
          } else {
            proxy(request, response, next);
          }
        } catch (e) {
          tui.showError('Failed to serve local file');
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

async function startBackgroundRunner(sessionID, tokenID) {
  async function install() {
    return new Promise((resolve, reject) => {
      const npm = spawn('npm', ['install'], {
        cwd: Config.background(),
      });

      npm.on('exit', (code) => {
        if (code === 0) {
          tui.showMessage('Packages installed');
          resolve();
        } else {
          reject();
        }
      });

      npm.stderr.on('data', (data) => {
        tui.showError(data);
      });
    });
  }

  function start() {
    const runner = spawn('node', ['main.js'], {
      cwd: Config.background(),
      env: {
        baseUrl: `${Config.host()}/services`,
        sessionID,
        tokenID,
      },
    });

    runner.on('exit', (code, signal) => {
      if (!runner.killed) {
        if (code === 0) {
          tui.showMessage('Background Wapp stopped normally');
        } else {
          tui.showError(`Background Wapp crashed - code ${code} and signal ${signal}`);
        }
      }
    });

    function printLog(data, type) {
      tui.showLog(data.toString().replace(/^\s+|\s+$/g, ''), 'Background', false, type);
    }

    runner.stdout.on('data', (data) => {
      printLog(data, false);
    });

    runner.stderr.on('data', (data) => {
      printLog(data, 'error');
    });

    tui.showMessage('Backgrouund Runner Started');
    return runner;
  }

  function stop(runner) {
    if (!runner) return;

    tui.showWarning('Restarting Background Runner ');
    runner.kill();
  }

  let restarting = false;
  let runner;
  try {
    await install();
    runner = start();
  } catch (e) {
    // empty
  }

  watch(Config.background(), {
    filter(f, skip) {
      // skip node_modules
      if (/\/node_modules/.test(f)) return skip;
      // skip .git folder
      if (/\.git/.test(f)) return skip;
      if (/\.#/.test(f)) return skip;
      // only watch for js and json files
      return /\.js|\.json$/.test(f);
    },
    recursive: true,
  }, (evt, name) => {
    if (!restarting) {
      restarting = true;
      stop(runner);
      if (name === `${Config.background()}/package.json`) {
        install().then(() => {
          runner = start();
          restarting = false;
        }).catch(() => {
          restarting = false;
        });
      } else {
        runner = start();
        restarting = false;
      }
    }
  });
}

(async () => {
  try {
    await wapp.init();
    const sessionID = await wapp.getInstallationSession();
    const tokenID = wapp.getInstallationToken();
    await wapp.openStream();

    if (wapp.hasForeground) {
      if (isForegroundPresent()) {
        startServer(sessionID, tokenID);
      } else {
        tui.showWarning('No foreground files found, local webserver is not started');
      }
    }

    if (wapp.hasBackground) {
      if (isBackgroundPresent()) {
        if (await wapp.installation.stop()) {
          startBackgroundRunner(sessionID, tokenID);
        } else {
          tui.showError('Not starting background runner');
        }
      } else {
        tui.showWarning('No background files found, local background runner is not started');
      }
    }
  } catch (err) {
    if (err.message === 'LoginError') {
      tui.showError('Failed to Login, please try again.');
    } else {
      tui.showError('Run error', err);
    }
    process.exit(-1);
  }
})();
