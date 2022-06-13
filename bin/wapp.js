#!/usr/bin/env node

const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');
const Create = require('../lib/cmd/create');
const Update = require('../lib/cmd/update');
const Delete = require('../lib/cmd/delete');
const Configure = require('../lib/cmd/configure');
const Serve = require('../lib/cmd/serve');

const mainDefinitions = [
  { name: 'command', defaultOption: true },
];

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
      { name: 'serve', summary: 'run a local web server for the foreground part of the wapp and opens a stream to the background wapp running on Wappsto.' },
      { name: 'configure', summary: 'Change settings for your wapp on wappsto.' },
      { name: 'delete', summary: 'Delete the Wapp on Wappsto.' },
    ],
  },
  {
    content: 'Project home: {underline https://github.com/wappsto/wappsto-cli}',
  },
];

try {
  const mainOptions = commandLineArgs(mainDefinitions, { stopAtFirstUnknown: true });
  /* eslint-disable-next-line no-underscore-dangle */
  const argv = mainOptions._unknown || [];

  switch (mainOptions.command) {
  case 'create':
    Create.run(argv);
    break;
  case 'update':
    Update.run(argv);
    break;
  case 'configure':
    Configure.run(argv);
    break;
  case 'delete':
    Delete.run(argv);
    break;
  case 'serve':
    Serve.run(argv);
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
