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
    content: 'Script to sync your local wapp files with wappsto.',
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
