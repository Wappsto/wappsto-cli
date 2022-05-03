import mockAxios from 'jest-mock-axios';
// import mockInquirer from 'mock-inquirer';
import readline from 'readline';
import tui from '../lib/tui.js';
import Config from '../lib/config.js';
import {
  deleteFolder,
  deleteFile,
  createFolders,
  saveFile,
  // fileExists,
  // directoryExists,
  // loadJsonFile,
} from '../lib/files.js';
import Wapp from '../lib/wapp.js';

describe('update', () => {
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

  test('update empty files', async () => {
    mockAxios.get.mockResolvedValue({ data: { meta: { id: 'version_id' } } });
    mockAxios.post.mockResolvedValue({ data: { meta: { id: 'version_id' } } });
    mockAxios.put.mockResolvedValue({ data: { meta: { id: 'version_id' } } });
    mockAxios.patch.mockResolvedValue({ data: { meta: { id: 'version_id' } } });
    mockAxios.delete.mockResolvedValue({
      data: { meta: { id: 'version_id' } },
    });

    const wapp = new Wapp();
    await wapp.update(); // const updatedFiles =

    expect(mockAxios.get).toHaveBeenCalledTimes(0);

    /* TODO
    expect(mockAxios.get).toHaveBeenCalledTimes(3);
    expect(mockAxios.get).toHaveBeenCalledWith(
      'https://wappsto.com/services/2.0/version/version_id?expand=2&verbose=true',
      {},
    );
    expect(mockAxios.get).toHaveBeenCalledWith(
      'https://wappsto.com/services/2.0/installation?expand=2&this_version_id=version_id',
      {},
    );
    expect(mockAxios.get).toHaveBeenCalledWith(
      'https://wappsto.com/services/2.0/application/undefined?expand=2&verbose=true',
      {},
    );

    expect(mockAxios.post).toHaveBeenCalledTimes(1);
    expect(mockAxios.post).toHaveBeenCalledWith(
      'https://wappsto.com/services/2.0/installation',
      { application: 'version_id' },
      {},
    );

    expect(mockAxios.patch).toHaveBeenCalledTimes(2);
    expect(mockAxios.patch).toHaveBeenCalledWith(
      'https://wappsto.com/services/2.0/version/version_id',
      {
        author: 'author',
        description: {
          foreground: 'foreground',
          general: 'general',
          version: '',
          widget: '',
        },
        name: 'Test Wapp',
        status: 'idle',
        supported_features: ['foreground'],
        title: '',
        version_app: '1.1.1',
      },
      {},
    );
    expect(mockAxios.patch).toHaveBeenCalledWith(
      'https://wappsto.com/services/2.0/installation/version_id',
      {
        restart: {
          new_process: true,
        },
      },
      {},
    );

    expect(mockAxios.delete).toHaveBeenCalledTimes(0);

    expect(updatedFiles).toEqual([]);
    */
  });
});

/*

test('update test files', async (t) => {
  const wapp = new Wapp();

  files.createFolders('foreground/testdir/file.js');
  files.saveFile('foreground/testdir/file.js', 'file 1');

  files.saveFile('foreground/file.bin', 'bin file');
  files.saveFile('foreground/img.png', 'png file');

  files.saveFile('icon/logo.png', 'png file');

  const updatedFiles = await wapp.update();

  t.deepEqual(updatedFiles, [
    {
      id: 'file_id',
      name: 'foreground/img.png',
      status: 'created',
    },
    {
      id: 'file_id',
      name: 'foreground/index.html',
      status: 'created',
    },
    {
      id: 'file_id',
      name: 'foreground/main.js',
      status: 'created',
    },
    {
      id: 'file_id',
      name: 'foreground/testdir/file.js',
      status: 'created',
    },
    {
      id: 'file_id',
      name: 'background/main.js',
      status: 'created',
    },
    {
      id: 'file_id',
      name: 'background/package.json',
      status: 'created',
    },
    {
      id: 'file_id',
      name: 'icon/logo.png',
      status: 'created',
    },
  ]);
});

test('update modified and deleted files', async (t) => {
  const wapp = new Wapp();

  files.saveFile('foreground/index.html', 'modified');
  files.deleteFile('foreground/main.js');
  files.createFolders('background/node_modules/ws/index.js');
  files.createFolders('background/ws/index.js');
  files.saveFile('background/ws/index.js', 'modified');
  files.saveFile('background/node_modules/ws/index.js', 'modified');
  files.saveFile('background/test.js', 'modified');

  t.deepEqual(files.directoryExists('background/node_modules'), true);

  await wapp.init();
  const updatedFiles = await wapp.update();

  t.deepEqual(updatedFiles, [
    {
      id: 'file_id',
      name: 'foreground/index.html',
      status: 'updated',
    },
    {
      id: 'file_id',
      name: 'foreground/main.js',
      status: 'deleted',
    },
    {
      id: 'file_id',
      name: 'background/test.js',
      status: 'created',
    },
    {
      id: 'file_id',
      name: 'background/ws/index.js',
      status: 'created',
    },
  ]);
});

test('reinstall test files', async (t) => {
  const wapp = new Wapp();
  await wapp.init();

  const updatedFiles = await wapp.update(true);

  t.deepEqual(updatedFiles, [
    {
      id: 'file_id',
      name: 'foreground/main.js',
      status: 'deleted',
    },
  ]);
});

*/
