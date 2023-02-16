import { setup, teardown } from './util/setup';
import serve from '../src/cmd/serve';
describe('Serve', () => {
  beforeEach(async () => {
    await setup();
  });

  afterEach(() => {
    teardown();
  });

  it('can show help for serve', async () => {
    const org = console.log;
    console.log = jest.fn();

    await serve(['--help']);
    expect(console.log).toHaveBeenCalledTimes(1);

    console.log = org;
  });

  it('can handle invalid input for serve', async () => {
    const org = console.log;
    console.log = jest.fn();

    await serve(['what']);
    expect(console.log).toHaveBeenCalledTimes(1);

    console.log = org;
  });
});
