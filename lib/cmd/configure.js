import commandLineArgs from 'command-line-args';
import commandLineUsage from 'command-line-usage';
import Wapp from '../wapp.js';
import tui from '../tui.js';

const optionDefinitions = [
  {
    name: 'help',
    description: 'Display this usage guide.',
    alias: 'h',
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
    header: 'Configure Wapp',
    content: 'Script to change settings for your wapp on wappsto.',
  },
  {
    header: 'Synopsis',
    content: [
      '$ wapp configure',
      '$ wapp configure {bold --verbose}',
      '$ wapp configure {bold --help}',
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

export default async function configure(argv) {
  const options = commandLineArgs(optionDefinitions, { argv });

  if (options.help) {
    process.stdout.write(commandLineUsage(sections));
    process.exit();
  }

  try {
    const wapp = new Wapp(options.verbose);
    await wapp.init();

    await wapp.configure();
  } catch (err) {
    tui.showError('Run error', err);
  }
}
