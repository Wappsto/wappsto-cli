#!/usr/bin/env node

/* istanbul ignore file */

import * as Sentry from '@sentry/node';
import commandLineArgs from 'command-line-args';
import commandLineUsage from 'command-line-usage';
import configure from './cmd/configure';
import create from './cmd/create';
import Delete from './cmd/delete';
import logout from './cmd/logout';
import publish from './cmd/publish';
import serve from './cmd/serve';
import update from './cmd/update';
import Config from './config';
import { startTrace } from './util/trace';
import tui from './util/tui';
import { VERSION } from './util/version';
import Wapp from './wapp';

const mainDefinitions = [{ name: 'command', defaultOption: true }];

const sections = [
  {
    header: 'wappsto-cli',
    content:
      'Script to create and maintain wapps on {underline https://wappsto.com}',
  },
  {
    header: 'Synopsis',
    content: '$ wapp <command> <options>',
  },
  {
    header: 'Command List',
    content: [
      { name: 'help', summary: 'Print information about this script.' },
      { name: 'create', summary: 'Create a new wapp on Wappsto.' },
      { name: 'update', summary: 'Sync your local files with wappsto.' },
      {
        name: 'serve',
        summary:
          'Run a local web server for the foreground part of the wapp and opens a stream to the background wapp running on Wappsto.',
      },
      {
        name: 'configure',
        summary: 'Change settings for your wapp on wappsto.',
      },
      {
        name: 'publish',
        summary: 'Publish a new version of your wapp to wappsto.',
      },
      { name: 'delete', summary: 'Delete the Wapp on Wappsto.' },
      { name: 'logout', summary: 'Delete your current session to Wappsto.' },
    ],
  },
  {
    header: 'Information',
    content: [
      {
        name: 'Project',
        summary: `{underline https://github.com/wappsto/wappsto-cli}`,
      },
      { name: 'Version', summary: VERSION },
    ],
  },
];

export function getHost() {
  return Config.host();
}

let wapp_session = '';

export async function getSession() {
  if (!wapp_session) {
    const wapp = new Wapp();
    await wapp.init();

    if (Config.userSession()) {
      wapp_session = wapp.wappsto.session.id;
    } else {
      wapp_session = (await wapp.getInstallationSession()) || '';
    }
  }
  return wapp_session;
}

if (
  process.argv.length > 1 &&
  (process.argv[1].includes('wappsto-cli') ||
    process.argv[1].includes('node_modules/.bin/wapp'))
) {
  let transaction;
  let command = 'unknown';

  (async () => {
    try {
      const mainOptions = commandLineArgs(mainDefinitions, {
        stopAtFirstUnknown: true,
      });
      const argv = mainOptions._unknown || [];

      transaction = startTrace(mainOptions.command);
      command = mainOptions.command;

      switch (command) {
        case 'create':
          await create(argv);
          break;
        case 'update':
          await update(argv);
          break;
        case 'configure':
          await configure(argv);
          break;
        case 'publish':
          await publish(argv);
          break;
        case 'delete':
          await Delete(argv);
          break;
        case 'serve':
          await serve(argv);
          break;
        case 'logout':
          await logout(argv);
          break;
        case 'help':
        default:
          console.log(commandLineUsage(sections));
          break;
      }
    } catch (e: unknown) {
      const err = e as Error;
      if (err.message === 'LoginError') {
        tui.showError('Failed to Login, please try again.');
      } else if (err.message === 'UpgradeError') {
        tui.showError(
          'Failed to upgrade old versions, are you sure that they are valid?'
        );
      } else {
        tui.showError(`Fatal error when running ${command} command`, err);
        Sentry.captureException(err);
      }
      process.exit(-1);
    } finally {
      transaction?.finish();
    }
  })();
}
