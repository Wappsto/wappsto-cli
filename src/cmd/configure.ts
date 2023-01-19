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

export default async function configure(argv: string[]) {
  const options = commandLineArgs(optionDefinitions, { argv });

  if (options.help) {
    process.stdout.write(commandLineUsage(sections));
    return 0;
  }

  if (!options.quiet) {
    tui.header('Configure Wapp');
  }

  try {
    const wapp = new Wapp(options.verbose);
    await wapp.init();

    await wapp.configure();
  } catch (err: any) {
    tui.showError('Run error', err);
  }
}
