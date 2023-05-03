import Wapp from '../wapp.update';
import setup from '../util/setup_cli';
import tui from '../util/tui';

const optionDefinitions = [
  {
    name: 'reinstall',
    description: 'Trigger a reinstall of the background wapp.',
    alias: 'r',
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
];

export default async function update(argv: string[]) {
  let options = setup('Update Wapp', argv, optionDefinitions, sections);
  if (!options) {
    return;
  }

  const wapp = new Wapp();
  if (!wapp.present()) {
    tui.showError('No Wapp found in current folder');
    return;
  }

  await wapp.init();

  try {
    const files = await wapp.update(options.reinstall);

    files.forEach((f) => {
      if (f.status.includes('not ')) {
        tui.showError(`File ${f.path} was ${f.status}`);
      } else {
        tui.showMessage(`File ${f.path} was ${f.status}`);
      }
    });
    tui.showMessage('Wapp Updated');
  } catch (err) {
    tui.showError('Failed to update Wapp');
  }
}
