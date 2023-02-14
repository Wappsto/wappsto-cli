import Wapp from '../wapp.create';
import setup from '../util/setup_cli';

const optionDefinitions = [
  {
    name: 'validate',
    description: 'Validate all the data that was send to Wappsto.',
    alias: 'V',
    type: Boolean,
  },
];

const sections = [
  {
    header: 'Create Wapp',
    content: 'Script to create a new wapp on wappsto.',
  },
  {
    header: 'Synopsis',
    content: [
      '$ wapp create',
      '$ wapp create {bold --validate} {bold --vervose}',
      '$ wapp create {bold --help}',
    ],
  },
];

export default async function create(argv: string[]) {
  let options = setup('Create Wapp', argv, optionDefinitions, sections);
  if(!options) {
    return;
  }

  const wapp = new Wapp();
  await wapp.init();
  await wapp.create(options.validate);
}
