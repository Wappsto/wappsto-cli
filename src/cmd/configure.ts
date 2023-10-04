import setup from '../util/setup_cli';
import tui from '../util/tui';
import Wapp from '../wapp.configure';

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
];

export default async function configure(argv: string[]) {
  const options = setup('Configure wapp', argv, [], sections);
  if (!options) {
    return;
  }

  const wapp = new Wapp();
  if (!wapp.present()) {
    tui.showError('No Wapp found in current folder');
    return;
  }

  await wapp.init();
  await wapp.configure();
}
