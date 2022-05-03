// import mockAxios from 'jest-mock-axios';
// import mockInquirer from 'mock-inquirer';
import readline from 'readline';
import tui from '../lib/tui.js';
import Config from '../lib/config.js';
import {
  deleteFolder,
  deleteFile,
  createFolders,
  saveFile,
  fileExists,
} from '../lib/files.js';
import Wapp from '../lib/wapp.js';

describe('wapp', () => {
  readline.cursorTo = () => {};
  readline.clearLine = () => {};
  tui.write = jest.fn();
  /* eslint-disable-next-line no-console */
  console.error = jest.fn();

  beforeAll(() => {
    deleteFolder(`${Config.cacheFolder()}`);
    deleteFile('manifest.json');
    deleteFolder('foreground');
    deleteFolder('background');
    deleteFolder('icon');

    createFolders(`${Config.cacheFolder()}/.`);
    saveFile(`${Config.cacheFolder()}/session`, 'session');
  });

  afterAll(() => {
    deleteFolder(`${Config.cacheFolder()}`);
    deleteFile('manifest.json');
    deleteFolder('foreground');
    deleteFolder('background');
    deleteFolder('icon');
  });

  test('tui header', () => {
    tui.header('test');

    expect(tui.write).toHaveBeenCalledTimes(1);
  });

  test('wapp constructor', () => {
    const wapp = new Wapp();

    expect(wapp.application.data).toEqual({});
    expect(wapp.application.version).toEqual([]);
    expect(wapp.manifest).toEqual({});
  });

  test('move files to cache folder', () => {
    const wapp = new Wapp();

    ['application', 'installation', 'session'].forEach((e) => {
      saveFile(`./.${e}`, e);
    });

    deleteFolder(`${wapp.cacheFolder}`);

    wapp.initCacheFolder();

    expect(fileExists(`${wapp.cacheFolder}/application`)).toEqual(true);
    expect(fileExists(`${wapp.cacheFolder}/installation`)).toEqual(true);
    expect(fileExists(`${wapp.cacheFolder}/session`)).toEqual(true);
  });
});
