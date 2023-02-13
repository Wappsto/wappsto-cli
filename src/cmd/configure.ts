import commandLineArgs from 'command-line-args';
import commandLineUsage from 'command-line-usage';
import Wapp from '../wapp.configure';
import tui from '../util/tui';

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
    name: 'debug',
    description: 'Enable debug output.',
    alias: 'd',
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
  let options;
  try {
    options = commandLineArgs(optionDefinitions, { argv });
  } catch (err: any) {
    tui.showError(err.message);
    console.log(commandLineUsage(sections));
    return;
  }

  if (options.help) {
    console.log(commandLineUsage(sections));
    return;
  }

  tui.debug = options.debug;
  tui.verbose = options.verbose;

  if (!options.quiet) {
    tui.header('Configure Wapp');
  }

  try {
    const wapp = new Wapp();
    await wapp.init();

    await wapp.configure();
  } catch (err: any) {
    tui.showError('Run error', err);
  }
}
