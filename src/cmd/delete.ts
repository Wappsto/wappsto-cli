import commandLineArgs from 'command-line-args';
import commandLineUsage from 'command-line-usage';
import Wapp from '../wapp';
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
    name: 'quiet',
    description: 'Do not print the header.',
    alias: 'q',
    type: Boolean,
  },
];

const sections = [
  {
    header: 'Delete Wapp',
    content: 'Script to delete the Wapp on Wappsto.',
  },
  {
    header: 'Synopsis',
    content: [
      '$ wapp delete',
      '$ wapp delete {bold --verbose}',
      '$ wapp delete {bold --help}',
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

export default async function Delete(argv: string[]) {
  const options = commandLineArgs(optionDefinitions, { argv });

  if (options.help) {
    process.stdout.write(commandLineUsage(sections));
    return;
  }

  try {
    if (!options.quiet) {
      await tui.header('Delete Wapp');
    }

    const wapp = new Wapp(options.verbose);
    if (wapp.present()) {
      await wapp.init();
      await wapp.delete();
    } else {
      tui.showError('No Wapp found in current folder');
    }
  } catch (err: any) {
    tui.showError('Run error', err);
  }
}
