import commandLineArgs from 'command-line-args';
import commandLineUsage from 'command-line-usage';
import Wapp from '../wapp';
import tui from '../tui';

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
  {
    name: 'quiet',
    description: 'Do not print the header.',
    alias: 'q',
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

export default async function create(argv: string[]) {
  const options = commandLineArgs(optionDefinitions, { argv });

  if (options.help) {
    process.stdout.write(commandLineUsage(sections));
    return;
  }

  if (!options.quiet) {
    await tui.header('Create Wapp');
  }

  try {
    const wapp = new Wapp(options.verbose);
    await wapp.init();
    await wapp.create(options.validate);
  } catch (err: any) {
    if (err.message === 'LoginError') {
      tui.showError('Failed to Login, please try again.');
    } else {
      tui.showError('Run error', err);
    }
  }
}
