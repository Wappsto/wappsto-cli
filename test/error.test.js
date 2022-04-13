import mockAxios from 'jest-mock-axios';
import mockInquirer from 'mock-inquirer';
import readline from 'readline';
import tui from '../lib/tui.js';
import Config from '../lib/config.js';
import {
  createFolders, saveJsonFile, saveFile, deleteFolder,
} from '../lib/files.js';
import Wapp from '../lib/wapp.js';

describe('error', () => {
  tui.write = () => { };

  // eslint-disable-next-line no-console
  console.error = () => { };
  readline.cursorTo = () => { };
  readline.clearLine = () => { };

  beforeEach(() => {
    deleteFolder(Config.cacheFolder());
    createFolders(`${Config.cacheFolder()}/`);
    saveJsonFile(`${Config.cacheFolder()}/application`, {
      version: [
        {
          meta: {
            id: 'wrong_version_id',
          },
        },
      ],
      meta: {
        id: 'application_id',
      },
    });

    saveJsonFile(`${Config.cacheFolder()}/installation`, {
      meta: {
        id: 'wrong_installation_id',
      },
    });

    saveFile(`${Config.cacheFolder()}/session`, 'session');

    mockAxios.get.mockRejectedValue({});
    mockAxios.put.mockRejectedValue({});
    mockAxios.post.mockRejectedValue({});
    mockAxios.patch.mockRejectedValue({});
    mockAxios.delete.mockRejectedValue({});
  });

  afterEach(() => {
    deleteFolder(Config.cacheFolder());
  });

  test('failed to update', async () => {
    const wapp = new Wapp();
    const updatedFiles = await wapp.update();

    expect(updatedFiles).toEqual([]);
    expect(mockAxios.patch).toHaveBeenCalledTimes(1);
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
  });

  test('failed to delete', async () => {
    mockInquirer([
      {
        del: true,
        local: true,
        remote: true,
      },
    ]);

    const wapp = new Wapp();
    await wapp.delete();

    expect(mockAxios.delete).toHaveBeenCalledTimes(3);
    expect(mockAxios.delete).toHaveBeenCalledWith('https://wappsto.com/services/2.0/version/wrong_version_id', {});
    expect(mockAxios.delete).toHaveBeenCalledWith('https://wappsto.com/services/2.0/installation?this_version_id=wrong_version_id', {});
    expect(mockAxios.delete).toHaveBeenCalledWith('https://wappsto.com/services/2.0/application/application_id', {});
  });
});
