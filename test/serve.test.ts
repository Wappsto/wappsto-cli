import axios from 'axios';
import { setup, teardown } from './util/setup';
import serve from '../src/cmd/serve';

describe('Serve', () => {
  let mockedAxios: jest.Mocked<typeof axios>;

  beforeEach(async () => {
    mockedAxios = await setup();
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

  it('can handle missing wapp', async () => {
    await serve([]);
    expect(mockedAxios.get).toHaveBeenCalledTimes(0);
  });
});
