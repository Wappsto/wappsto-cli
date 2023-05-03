import Wapp from '../wapp.create';
import setup from '../util/setup_cli';

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
  let options = setup('Create Wapp', argv, [], sections);
  if (!options) {
    return;
  }

  const wapp = new Wapp();
  await wapp.init();
  await wapp.create();
}
