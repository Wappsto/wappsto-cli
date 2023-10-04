import setup from '../util/setup_cli';
import tui from '../util/tui';
import Wapp from '../wapp.delete';

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
];

export default async function Delete(argv: string[]) {
  const options = setup('Delete Wapp', argv, [], sections);
  if (!options) {
    return;
  }

  const wapp = new Wapp();
  if (!wapp.present()) {
    tui.showError('No Wapp found in current folder');
    return;
  }

  await wapp.init();
  await wapp.delete();
}
