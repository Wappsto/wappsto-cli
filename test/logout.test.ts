import logout from '../src/cmd/logout';
import Config from '../src/config';
import { fileExists } from '../src/util/files';
import { createWapp, setup, teardown } from './util/setup';

describe('Logout', () => {
  beforeEach(async () => {
    await setup();
  });

  afterEach(() => {
    teardown();
  });

  it('can show help for logout', async () => {
    const org = console.log;
    console.log = jest.fn();

    await logout(['--help']);
    expect(console.log).toHaveBeenCalledTimes(1);

    console.log = org;
  });

  it('can handle invalid input for logout', async () => {
    const org = console.log;
    console.log = jest.fn();

    await logout(['what']);
    expect(console.log).toHaveBeenCalledTimes(1);

    console.log = org;
  });

  it('can remove the session', async () => {
    createWapp();

    await logout([]);

    expect(fileExists(`${Config.cacheFolder()}/session`)).toBe(false);
  });
});
