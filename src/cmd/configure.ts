import Wapp from '../wapp.configure';
import setup from '../util/setup_cli';

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
  let options = setup('Configure wapp', argv, [], sections);
  if (!options) {
    return;
  }

  const wapp = new Wapp();
  await wapp.init();
  await wapp.configure();
}
