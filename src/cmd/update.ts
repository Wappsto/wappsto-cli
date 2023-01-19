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
    name: 'reinstall',
    description: 'Trigger a reinstall of the background wapp.',
    alias: 'r',
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
    header: 'Update Wapp',
    content: 'Script to sync your local files with wappsto.',
  },
  {
    header: 'Synopsis',
    content: [
      '$ wapp update',
      '$ wapp update {bold --reinstall}',
      '$ wapp update {bold --help}',
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

export default async function update(argv: string[]) {
  const options = commandLineArgs(optionDefinitions, { argv });

  if (options.help) {
    process.stdout.write(commandLineUsage(sections));
    process.exit();
  }

  if (!options.quiet) {
    await tui.header('Update Wapp');
  }

  try {
    const wapp = new Wapp(options.verbose);
    await wapp.init();

    const files = await wapp.update(options.reinstall);
    files.forEach((f) => {
      tui.showMessage(`${f.name} was ${f.status}`);
    });
  } catch (err: any) {
    tui.showError('Run error', err);
  }
}
