import mockInquirer from 'mock-inquirer';
import Config from '../lib/config.js';
import {
  deleteFolder,
  deleteFile,
  createFolders,
  saveFile,
  fileExists,
  directoryExists,
} from '../lib/files.js';
import Wapp from '../lib/wapp.js';

describe('delete', () => {
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

  test('delete wapp', async () => {
    const wapp = new Wapp();

    mockInquirer([
      {
        del: true,
        local: true,
        remote: true,
      },
    ]);

    await wapp.delete();

    expect(directoryExists('foreground')).toEqual(false);
    expect(directoryExists('background')).toEqual(false);
    expect(directoryExists('icon')).toEqual(false);
    expect(fileExists(`${wapp.cacheFolder}/application`)).toEqual(false);
    expect(fileExists(`${wapp.cacheFolder}/installation`)).toEqual(false);
    expect(fileExists('manifest.json')).toEqual(false);
    expect(fileExists(`${wapp.cacheFolder}/session`)).toEqual(true);
  });

  test('delete custom wapp', async () => {
    const wapp = new Wapp();

    mockInquirer([
      {
        del: true,
        local: true,
        remote: true,
      },
    ]);

    await wapp.delete();

    expect(directoryExists('customForeground')).toEqual(false);
    expect(directoryExists('customBackground')).toEqual(false);
    expect(directoryExists('foreground')).toEqual(false);
    expect(directoryExists('background')).toEqual(false);
    expect(directoryExists('icon')).toEqual(false);
    expect(fileExists(`${wapp.cacheFolder}/application`)).toEqual(false);
    expect(fileExists(`${wapp.cacheFolder}/installation`)).toEqual(false);
    expect(fileExists('manifest.json')).toEqual(false);

    deleteFile('wappsto.json');
  });
});
