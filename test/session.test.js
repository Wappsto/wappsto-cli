import mockAxios from 'jest-mock-axios';
import mockInquirer from 'mock-inquirer';
import readline from 'readline';
import tui from '../lib/tui.js';
import {
  deleteFile, deleteFolder, loadFile, saveFile,
} from '../lib/files.js';
import Wapp from '../lib/wapp.js';
import Config from '../lib/config.js';

describe('session', () => {
  tui.write = () => {};
  readline.cursorTo = () => {};
  readline.clearLine = () => {};

  beforeEach(() => {
    deleteFile(`${Config.cacheFolder()}/session`);
    deleteFile(`${Config.cacheFolder}/application`);
    deleteFile(`${Config.cacheFolder}/installation`);
    deleteFile('manifest.json');
    deleteFolder('foreground');
    deleteFolder('background');
    deleteFolder('icon');
  });

  describe('will fail when input is', () => {
    test('empty', async () => {
      const wapp = new Wapp();

      mockInquirer([
        {
          username: '',
          password: '',
        },
      ]);

      let errorMessage = '';
      try {
        await wapp.init();
      } catch (err) {
        errorMessage = err.message;
      }
      expect(errorMessage).toBe('Validation failed for field username');
    });

    test('only username', async () => {
      const wapp = new Wapp();

      mockInquirer([
        {
          username: 'user',
          password: '',
        },
      ]);

      let errorMessage = '';
      try {
        await wapp.init();
      } catch (err) {
        errorMessage = err.message;
      }
      expect(errorMessage).toBe('Validation failed for field password');
    });

    test('wrong password', async () => {
      const wapp = new Wapp();

      mockInquirer([
        {
          username: 'user@wappsto.com',
          password: 'wrong',
        },
      ]);
      mockAxios.post.mockRejectedValueOnce({});

      let errorMessage = '';
      try {
        await wapp.init();
      } catch (err) {
        errorMessage = err.message;
      }

      expect(mockAxios.get).toHaveBeenCalledTimes(0);
      expect(mockAxios.post).toHaveBeenCalledTimes(1);
      expect(mockAxios.post).toHaveBeenCalledWith(
        'https://wappsto.com/services/2.1/session',
        { password: 'wrong', remember_me: true, username: 'user@wappsto.com' },
        {},
      );
      expect(errorMessage).toBe('LoginError');
    });
  });

  test('Login', async () => {
    const wapp = new Wapp();

    mockInquirer(
      [
        {
          username: 'user@wappsto.com',
          password: 'password',
        },
      ],
      {},
    );
    mockAxios.post.mockResolvedValueOnce({ data: { meta: { id: 'session' } } });

    expect(loadFile(`${Config.cacheFolder()}/session`)).toEqual(false);

    await wapp.init();

    expect(mockAxios.post).toHaveBeenCalledTimes(1);
    expect(mockAxios.post).toHaveBeenCalledWith(
      'https://wappsto.com/services/2.1/session',
      { password: 'password', remember_me: true, username: 'user@wappsto.com' },
      {},
    );
    expect(loadFile(`${Config.cacheFolder()}/session`)).toEqual('session');
  });

  test('Validate session', async () => {
    mockAxios.get.mockRejectedValueOnce({});
    mockAxios.post.mockResolvedValueOnce({ data: { meta: { id: 'session' } } });

    mockInquirer(
      [
        {
          username: 'user@wappsto.com',
          password: 'password',
        },
      ],
      {},
    );
    saveFile(`${Config.cacheFolder()}/session`, 'invalid');

    const wapp = new Wapp();
    await wapp.init();

    expect(mockAxios.post).toHaveBeenCalledTimes(1);
    expect(mockAxios.get).toHaveBeenCalledTimes(1);

    mockAxios.get.mockResolvedValueOnce({ data: { meta: { id: 'session' } } });

    await wapp.init();

    expect(mockAxios.get).toHaveBeenCalledTimes(2);
    expect(mockAxios.get).toHaveBeenCalledWith(
      'https://wappsto.com/services/2.1/session',
      {},
    );
    expect(loadFile(`${Config.cacheFolder()}/session`)).toEqual('session');
  });
});
