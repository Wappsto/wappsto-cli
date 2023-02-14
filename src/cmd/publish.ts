import Wapp from '../wapp.publish';
import setup from '../util/setup_cli';

const sections = [
  {
    header: 'Publish Wapp',
    content: 'Script to publish a new version of your wapp to wappsto.',
  },
  {
    header: 'Synopsis',
    content: ['$ wapp publish', '$ wapp publish {bold --help}'],
  },
];

export default async function publish(argv: string[]) {
  let options = setup('Publish Wapp', argv, [], sections);
  if (!options) {
    return;
  }

  const wapp = new Wapp();
  await wapp.init();
  await wapp.publish();
}
