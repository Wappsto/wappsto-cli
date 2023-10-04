import Session from '../session';
import setup from '../util/setup_cli';
import tui from '../util/tui';

const sections = [
  {
    header: 'Logout of Wappsto',
    content: 'Script to delete current session.',
  },
  {
    header: 'Synopsis',
    content: [
      '$ wapp logout',
      '$ wapp delete {bold --verbose}',
      '$ wapp delete {bold --help}',
    ],
  },
];

export default async function logout(argv: string[]) {
  const options = setup('Logout', argv, [], sections);
  if (!options) {
    return;
  }

  const session = new Session();
  session.clear();
  tui.showMessage('Session cleared');
}
