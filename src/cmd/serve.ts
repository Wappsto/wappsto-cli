import commandLineArgs from 'command-line-args';
import commandLineUsage from 'command-line-usage';
import url from 'url';
import fs from 'fs';
import path from 'path';
import watch from 'node-watch';
import detect from 'detect-port';
import spawn from 'cross-spawn';
import bs from 'browser-sync';
//import { createProxyMiddleware } from 'http-proxy-middleware';
import {
  createProxyMiddleware,
  Filter,
  Options,
  RequestHandler,
} from 'http-proxy-middleware';

import Wapp from '../wapp';
import Config from '../config';
import tui from '../util/tui';
import { directoryExists, fileExists } from '../util/files';

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
  {
    name: 'remote',
    description: 'Run the background wapp on the server',
    alias: 'r',
    type: Boolean,
  },
  {
    name: 'nobrowser',
    description: 'Do not open the browser',
    alias: 'n',
    type: Boolean,
  },
  {
    name: 'reinstall',
    description: 'Trigger a reinstall of the background wapp.',
    alias: 'i',
    type: Boolean,
  },
  {
    name: 'quiet',
    description: 'Do not print the header.',
    alias: 'q',
    type: Boolean,
  },
];

const sections = [
  {
    header: 'Serve Wapp',
    content:
      'Script to run a local web server for the foreground part of the wapp and opens a stream to the background wapp running on Wappsto.',
  },
  {
    header: 'Synopsis',
    content: [
      '$ wapp serve',
      '$ wapp serve {bold --port 4000} {bold --verbose}',
      '$ wapp serve {bold --remote} {bold --nobrowser}',
      '$ wapp serve {bold --help}',
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

export default async function serve(argv: string[]) {
  const options = commandLineArgs(optionDefinitions, { argv });

  if (options.help) {
    process.stdout.write(commandLineUsage(sections));
    return;
  }

  let wapp: Wapp;

  function isForegroundPresent(): boolean {
    const index = path.join(Config.foreground(), 'index.html');
    if (!fs.existsSync(index)) {
      tui.showWarning(`File '${index}' not found.`);
      return false;
    }
    return true;
  }

  function isBackgroundPresent(): boolean {
    const index = path.join(Config.background(), 'main.js');
    if (!fs.existsSync(index)) {
      tui.showWarning(`File '${index}' not found.`);
      return false;
    }
    return true;
  }

  async function startForegroundServer(
    sessionID: string,
    tokenID: string
  ): Promise<void> {
    const port = options.port || Config.port();
    const newPort = await detect(port);

    if (port !== newPort) {
      tui.showWarning(`${port} is in use, switching to ${newPort}`);
    }

    function haveFile(dir: string, request: any): boolean {
      const uri = url.parse(request.url).pathname || '';
      const filename = path.join(process.cwd(), dir, uri);
      const index = 'index.html';

      if (directoryExists(filename)) {
        if (fileExists(filename + index)) {
          if (request.url.endWith() !== '/') {
            request.url += '/';
          }
          request.url += index;
          return true;
        }
      } else if (fileExists(filename)) {
        return true;
      }
      return false;
    }
    /*
    const proxy = createProxyMiddleware('/services', {
      target: `${Config.host()}`,
      changeOrigin: true,
      logLevel: 'silent',
      ws: true, // proxy websockets
      onError(err) {
        tui.showError(err);
      },
      onProxyReq(proxyReq: any, req: any) {
        req.headers['x-session'] = sessionID;
        req.headers.tokenID = tokenID;
        if (req.headers && req.headers.referer) {
          req.headers.referer = req.headers.referer.replace(
            `http://localhost:${newPort}`,
            `${Config.host()}`
          );
        }
      },
      onProxyRes(proxyRes: any) {
        if (proxyRes.headers && proxyRes.headers.location) {
          // eslint-disable-next-line no-param-reassign
          proxyRes.headers.location = proxyRes.headers.location.replace(
            Config.host(),
            `http://localhost:${newPort}`
          );
        }
      },
    });
*/
    const server = {
      baseDir: Config.foreground(),
      /*middleware: [
        function localServe(request: any, response: any, next: any): void {
          response.setHeader(
            'set-cookie',
            `sessionID=${sessionID}; tokenID=${tokenID}; SameSite=Lax`
          );
          try {
            // check if requested file exists locally
            if (haveFile(Config.foreground(), request)) {
              next();
            } else {
              proxy(request, response, next);
            }
          } catch (e) {
            tui.showError('Failed to serve local file');
          }
        },
      ],*/
    };

    // .init starts the server
    bs.init({
      logPrefix: 'Wappsto Cli',
      port: newPort,
      ui: false,
      server,
      //cwd: Config.foreground(),
      files: '*',
      browser: Config.browser(),
      open: !options.nobrowser,
    });
  }

  function registerBackgroundWatcher(cb: any): void {
    let restarting = false;
    watch(
      Config.background(),
      {
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
      },
      (evt, name) => {
        if (!restarting) {
          restarting = true;
          cb(name).then(() => {
            restarting = false;
          });
        }
      }
    );
  }

  async function startRemoteBackgroundRunner(): Promise<void> {
    tui.showMessage('Starting the background wapp on the server');
    registerBackgroundWatcher(async (name: string) => {
      wapp.uploadFile(name);
    });
  }

  async function startLocalBackgroundRunner(
    sessionID: string,
    tokenID: string
  ): Promise<void> {
    tui.showMessage('Starting the background wapp locally');
    async function install() {
      return new Promise<void>((resolve, reject) => {
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

        npm.stderr?.on('data', (data) => {
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
          DISABLE_LOG: 'true',
        },
      });

      runner.on('exit', (code, signal) => {
        if (!runner.killed) {
          if (code === 0) {
            tui.showMessage('Background Wapp stopped normally');
          } else {
            tui.showError(
              `Background Wapp crashed - code ${code} and signal ${signal}`
            );
          }
        }
      });

      function printLog(data: any, type: string) {
        tui.showLog(
          data.toString().replace(/^\s+|\s+$/g, ''),
          'Background',
          '',
          type
        );
      }

      runner.stdout?.on('data', (data) => {
        printLog(data, 'normal');
      });

      runner.stderr?.on('data', (data) => {
        printLog(data, 'error');
      });

      tui.showMessage('Background Runner Started');
      return runner;
    }

    function stop(runner: any) {
      if (!runner) return;

      tui.showWarning('Restarting Background Runner ');
      runner.kill();
    }

    let runner: any;
    try {
      await install();
      runner = start();
    } catch (e) {
      // empty
    }

    registerBackgroundWatcher(async (name: string) => {
      stop(runner);
      if (name === `${Config.background()}/package.json`) {
        install()
          .then(() => {
            runner = start();
          })
          .catch(() => {
            // empty
          });
      } else {
        runner = start();
      }
    });
  }

  if (!options.quiet) {
    await tui.header('Serve Wapp');
  }

  wapp = new Wapp(options.verbose, options.remote || false);

  if (!wapp.present()) {
    tui.showError('No Wapp found in current folder');
    return;
  }

  try {
    await wapp.init();

    if (wapp.hasBackground && options.reinstall) {
      await wapp.installation.reinstall();
    }

    const sessionID = await wapp.getInstallationSession();
    if (!sessionID) {
      return;
    }

    const tokenID = wapp.getInstallationToken();
    await wapp.openStream();

    if (wapp.hasForeground) {
      if (isForegroundPresent()) {
        startForegroundServer(sessionID, tokenID);
      } else {
        tui.showWarning(
          'No foreground files found, local webserver is not started'
        );
      }
    }

    if (wapp.hasBackground) {
      if (isBackgroundPresent()) {
        if (options.remote) {
          const backgroundFiles = await wapp.update();
          backgroundFiles.forEach((f) => {
            tui.showMessage(`${f.name} was ${f.status}`);
          });
          startRemoteBackgroundRunner();
        } else if (await wapp.installation.stop()) {
          startLocalBackgroundRunner(sessionID, tokenID);
        } else {
          tui.showError(
            'Failed to stop the background runner on the server. Not starting background runner'
          );
        }
      } else {
        tui.showWarning(
          'No background files found, local background runner is not started'
        );
      }
    }
  } catch (err: any) {
    if (err.message === 'LoginError') {
      tui.showError('Failed to Login, please try again.');
    } else {
      tui.showError('Run error', err);
    }
    return;
  }
}
