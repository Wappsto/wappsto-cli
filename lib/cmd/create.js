const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');
const Wapp = require('../wapp');
const tui = require('../tui');

module.exports = {
  run: (argv) => {
    const optionDefinitions = [
      {
        name: 'help',
        description: 'Display this usage guide.',
        alias: 'h',
        type: Boolean,
      },
      {
        name: 'validate',
        description: 'Validate all the data that was send to Wappsto.',
        alias: 'V',
        type: Boolean,
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
        header: 'Create Wapp',
        content: 'Script to create a new wapp on wappsto.',
      },
      {
        header: 'Synopsis',
        content: [
          '$ wapp create',
          '$ wapp create {bold --validate} {bold --vervose}',
          '$ wapp create {bold --help}',
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

    const options = commandLineArgs(optionDefinitions, { argv });

    if (options.help) {
      process.stdout.write(commandLineUsage(sections));
      process.exit();
    }

    tui.header('Create Wapp');

    (async () => {
      try {
        const wapp = new Wapp(options.verbose);
        await wapp.init();
        await wapp.create(options.validate);
      } catch (err) {
        if (err.message === 'LoginError') {
          tui.showError('Failed to Login, please try again.');
        } else {
          tui.showError('Run error', err);
        }
        process.exit(-1);
      }
    })();
  },
};
