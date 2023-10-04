import setup from '../util/setup_cli';
import Wapp from '../wapp.create';

const sections = [
  {
    header: 'Create Wapp',
    content: 'Script to create a new wapp on wappsto.',
  },
  {
    header: 'Synopsis',
    content: [
      '$ wapp create',
      '$ wapp create {bold --verbose}',
      '$ wapp create {bold --help}',
    ],
  },
];

export default async function create(argv: string[]) {
  const options = setup('Create Wapp', argv, [], sections);
  if (!options) {
    return;
  }

  const wapp = new Wapp();
  await wapp.init();
  await wapp.create();
}
