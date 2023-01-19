#!/usr/bin/env node

import commandLineArgs from 'command-line-args';
import commandLineUsage from 'command-line-usage';
import create from './cmd/create';
import update from './cmd/update';
import Delete from './cmd/delete';
import configure from './cmd/configure';
import serve from './cmd/serve';

const mainDefinitions = [{ name: 'command', defaultOption: true }];

const sections = [
  {
    header: 'wappsto-cli',
    content: 'Script to create and maintain wapps on {underline wappsto.com}',
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
      break;
  }
} catch (e: any) {
  process.stdout.write(e.message);
  process.exit(-1);
}
