/* istanbul ignore file */
import fs from 'fs';
import { IncomingMessage, ServerResponse } from 'http';
import path from 'path';
import url from 'url';
import browserSync from 'browser-sync';
import spawn from 'cross-spawn';
import detect from 'detect-port';
import {
  startLocalBackgroundRunner,
  startRemoteBackgroundRunner,
} from '../background';
import Config from '../config';
import { directoryExists, fileExists, loadFile } from '../util/files';
import { getFileType } from '../util/helpers';
import setup from '../util/setup_cli';
import tui from '../util/tui';
import Wapp from '../wapp.serve';

const optionDefinitions = [
  {
    name: 'port',
    description: 'Change the port that the foreground wapp is served on.',
    alias: 'p',
    type: Number,
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
    description: 'Trigger a reinstall of the installed wapp.',
    alias: 'i',
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
];

export default async function serve(argv: string[]) {
  const options = setup('Serve Wapp', argv, optionDefinitions, sections);
  if (!options) {
    return;
  }

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
    tokenID: string,
    userPort?: number,
    open?: boolean
  ): Promise<void> {
    const port = userPort || Config.port();
    const newPort = await detect(port);

    if (port !== newPort) {
      tui.showWarning(`${port} is in use, switching to ${newPort}`);
    }

    function getFileName(dir: string, request: IncomingMessage): string {
      if (!request.url) {
        return '';
      }
      const uri = url.parse(request.url).pathname || '';
      const filename = path.join(process.cwd(), dir, uri);
      const index = 'index.html';

      if (directoryExists(filename)) {
        if (fileExists(filename + index)) {
          return filename + index;
        }
      } else if (fileExists(filename)) {
        return filename;
      }
      return '';
    }

    const bs = browserSync.create('Wappsto Wapp');

    // .init starts the server
    bs.init({
      logPrefix: 'Wappsto Cli',
      port: newPort,
      ui: false,
      https: false,
      proxy: {
        target: `${Config.host()}`,
        ws: true, // proxy websocket
        proxyReq: [
          (req: IncomingMessage) => {
            if (!req.headers) {
              req.headers = {};
            }
            req.headers['x-session'] = sessionID;

            if (req.headers && req.headers.referer) {
              req.headers.referer = req.headers.referer.replace(
                `http://localhost:${newPort}`,
                `${Config.host()}`
              );
            }
          },
        ],
      },
      middleware: (
        request: IncomingMessage,
        response: ServerResponse,
        next: () => void
      ) => {
        response.setHeader(
          'set-cookie',
          `sessionID=${sessionID}; tokenID=${tokenID}; SameSite=Lax`
        );
        try {
          if (request.url?.includes('services')) {
            next();
          } else {
            const filename = getFileName(Config.foreground(), request);
            // check if requested file exists locally
            if (filename) {
              response.writeHead(200, {
                'Content-Type': getFileType(filename),
              });
              response.end(loadFile(filename));
            } else {
              response.writeHead(404, { 'Content-Type': 'text/plain' });
              response.end('Not found in your foreground wapp');
            }
          }
        } catch (e) {
          tui.showError('Failed to serve local file', e);
        }
      },
      cwd: Config.foreground(),
      files: '*',
      browser: Config.browser(),
      open,
      online: true,
    });
  }

  const wapp = new Wapp(options.remote || false);

  if (!wapp.present()) {
    tui.showError('No Wapp found in current folder');
    tui.showMessage('You need to create a wapp first, using `npx wapp create`');
    return;
  }

  await wapp.init();

  if (!(wapp.hasForeground || wapp.hasBackground)) {
    tui.showError('Wapp do not have a foreground or background');
    return;
  }

  if (options.reinstall) {
    tui.showMessage('Reinstalling...');
    await wapp.installation.reinstall();
  }

  let sessionID;
  let backgroundSessionID: string;
  if (Config.userSession()) {
    tui.showWarning('Using USER session');
    sessionID = wapp.wappsto.session.id;
    backgroundSessionID = sessionID;
  } else {
    sessionID = await wapp.getInstallationSession();
    backgroundSessionID = wapp.getBackgroundInstallationSession();
  }
  if (!sessionID) {
    tui.showError('Failed to get Session from Installation');
    return;
  }

  const tokenID = wapp.getInstallationToken();
  await wapp.openStream();

  if (wapp.hasForeground) {
    if (isForegroundPresent()) {
      if (Config.webServer()) {
        tui.showMessage(
          `Starting Web Server with command: "${Config.webServer()}"`
        );
        const cmd = Config.webServer().split(' ');
        const server = spawn(cmd[0], cmd.slice(1), { stdio: 'inherit' });

        server.on('exit', (code, signal) => {
          if (code === 0) {
            tui.showMessage('Web Server stopped!');
          } else {
            tui.showError(
              `Web Server crashed - code ${code} and signal ${signal}`
            );
          }
        });
      } else {
        startForegroundServer(
          sessionID,
          tokenID,
          options.port,
          !options.nobrowser
        );
      }
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
        startRemoteBackgroundRunner(wapp);
      } else if (await wapp.installation.stop()) {
        startLocalBackgroundRunner(backgroundSessionID, tokenID);
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
}
