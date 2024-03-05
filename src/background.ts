import { ChildProcess } from 'child_process';
import spawn from 'cross-spawn';
import Config from './config';
import { JsonObjType } from './types/custom';
import { fileExists } from './util/files';
import registerBackgroundWatcher from './util/registerBackgroundWatcher';
import tui from './util/tui';

const PACKAGE = `${Config.background()}/package.json`;

export async function startRemoteBackgroundRunner(wapp: {
  uploadFile: (name: string) => void;
}): Promise<void> {
  tui.showMessage('Starting the background wapp on the server');
  registerBackgroundWatcher(async (name: string) => {
    wapp.uploadFile(name);
  });
}

export async function startLocalBackgroundRunner(
  sessionID: string,
  tokenID: string
): Promise<void> {
  tui.showMessage('Starting the background wapp locally');
  async function install() {
    if (!fileExists(PACKAGE)) {
      tui.showWarning(`Not installing packages - ${PACKAGE} is missing!`);
      return;
    }
    return new Promise<void>((resolve, reject) => {
      const npm = spawn('npm', ['install'], {
        cwd: Config.background(),
        env: process.env,
      });

      npm.on('exit', (code) => {
        if (code === 0) {
          tui.showMessage('Packages installed');
          resolve();
        } else {
          reject();
        }
      });

      npm.stderr?.on('data', (data: string) => {
        data
          .toString()
          .split('\n')
          .forEach((msg: string) => tui.showError(msg));
      });
    });
  }

  function start() {
    const runner = spawn('node', ['main.js'], {
      cwd: Config.background(),
      env: {
        ...process.env,
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

    function printLog(data: JsonObjType, type: string) {
      data
        .toString()
        .split('\n')
        .forEach((msg: string) =>
          tui.showLog(msg.replace(/^\s+|\s+$/g, ''), 'Background', '', type)
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

  function stop(runner: ChildProcess) {
    if (!runner) return;

    tui.showWarning('Restarting Background Runner');
    runner.kill();
  }

  let runner: ChildProcess;
  try {
    await install();
    runner = start();
  } catch (e) {
    // empty
  }

  registerBackgroundWatcher(async (name: string) => {
    stop(runner);
    if (name === PACKAGE) {
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
