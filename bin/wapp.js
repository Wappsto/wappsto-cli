#!/usr/bin/env node

import commandLineArgs from 'command-line-args';
import commandLineUsage from 'command-line-usage';
import create from '../lib/cmd/create.js';
import update from '../lib/cmd/update.js';
import Delete from '../lib/cmd/delete.js';
import configure from '../lib/cmd/configure.js';
import serve from '../lib/cmd/serve.js';

const mainDefinitions = [{ name: 'command', defaultOption: true }];

const sections = [
  {
    header: 'Wapp',
    content: 'Script to create and update wapps on wappsto.',
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
          'run a local web server for the foreground part of the wapp and opens a stream to the background wapp running on Wappsto.',
      },
      {
        name: 'configure',
        summary: 'Change settings for your wapp on wappsto.',
      },
      { name: 'delete', summary: 'Delete the Wapp on Wappsto.' },
    ],
  },
  {
    content: 'Project home: {underline https://github.com/wappsto/wappsto-cli}',
  },
];

try {
  const mainOptions = commandLineArgs(mainDefinitions, {
    stopAtFirstUnknown: true,
  });
  /* eslint-disable-next-line no-underscore-dangle */
  const argv = mainOptions._unknown || [];

  switch (mainOptions.command) {
    case 'create':
      create(argv);
      break;
    case 'update':
      update(argv);
      break;
    case 'configure':
      configure(argv);
      break;
    case 'delete':
      Delete(argv);
      break;
    case 'serve':
      serve(argv);
      break;
    case 'help':
    default:
      process.stdout.write(commandLineUsage(sections));
      process.exit();
      break;
  }
} catch (e) {
  process.stdout.write(e.message);
  process.exit();
}
