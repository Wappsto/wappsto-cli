import axios from 'axios';
import prompts from 'prompts';
import { setup, teardown } from './util/setup';
import { loadFile, saveFile, createFolders } from '../src/util/files';
import Config from '../src/config';
import Wapp from '../src/wapp';

describe('Session', () => {
  let mockedAxios: jest.Mocked<typeof axios>;

  beforeEach(async () => {
    mockedAxios = await setup(false);
  });

  afterEach(() => {
    jest.clearAllMocks();
    teardown();
  });

  it('can handle login error', async () => {
    const wapp = new Wapp();

    prompts.inject([]);

    try {
      await wapp.init();
      fail('It should not get here');
    } catch (err: any) {
      expect(err.message).toEqual('LoginError');
    }
  });

  it('can login', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        meta: {
          id: 'session',
          type: 'session',
        },
      },
    });
    const wapp = new Wapp();

    prompts.inject(['user@wappsto.com', 'password']);

    await wapp.init();

    expect(loadFile(`${Config.cacheFolder()}/session`)).toEqual('session');

    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://wappsto.com/services/2.1/session',
      { password: 'password', remember_me: true, username: 'user@wappsto.com' },
      {}
    );
  });

  it('can validate a session', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        meta: {
          id: 'session',
          type: 'session',
        },
      },
    });

    createFolders(Config.cacheFolder());
    saveFile(`${Config.cacheFolder()}/session`, 'session');

    const wapp = new Wapp();
    await wapp.init();

    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://wappsto.com/services/2.1/session/session',
      {}
    );
  });

  it('can validate invalid session', async () => {
    mockedAxios.get.mockRejectedValueOnce({
      data: {
        meta: { type: 'httpresponse', version: '2.1' },
        message: 'X-Session is not valid',
        code: 117000000,
        service: 'session',
      },
    });
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        meta: {
          id: 'session',
          type: 'session',
        },
      },
    });

    createFolders(Config.cacheFolder());
    saveFile(`${Config.cacheFolder()}/session`, 'invalid');
    prompts.inject(['user@wappsto.com', 'password']);

    const wapp = new Wapp();
    await wapp.init();

    expect(loadFile(`${Config.cacheFolder()}/session`)).toEqual('session');

    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://wappsto.com/services/2.1/session/invalid',
      {}
    );
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://wappsto.com/services/2.1/session',
      { password: 'password', remember_me: true, username: 'user@wappsto.com' },
      {}
    );
  });
});
