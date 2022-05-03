import mockAxios from 'jest-mock-axios';
import mockInquirer from 'mock-inquirer';
import readline from 'readline';
import tui from '../lib/tui.js';
import Config from '../lib/config.js';
import {
  deleteFolder,
  deleteFile,
  createFolders,
  saveFile,
  fileExists,
  directoryExists,
  loadJsonFile,
} from '../lib/files.js';
import Wapp from '../lib/wapp.js';

describe('create', () => {
  readline.cursorTo = () => {};
  readline.clearLine = () => {};
  tui.write = jest.fn();
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

  test('fail to create new wapp', async () => {
    mockAxios.get
      .mockRejectedValueOnce({})
      .mockRejectedValueOnce({})
      .mockRejectedValueOnce({});

    mockInquirer([
      {
        name: '',
      },
      {
        name: 'Test Wapp',
        author: 'author',
        version: 'wrong',
      },
      {
        name: 'Test Wapp',
        author: 'author',
        version: '1.1.1',
        features: [],
      },
    ]);

    const wapp = new Wapp();

    await expect(wapp.create()).rejects.toThrow(
      'Validation failed for field name',
    );
    await expect(wapp.create()).rejects.toThrow(
      'Validation failed for field version',
    );
    await expect(wapp.create()).rejects.toThrow(
      'Validation failed for field features',
    );

    expect(mockAxios.get).toHaveBeenCalledTimes(3);
    expect(mockAxios.get).toHaveBeenCalledWith(
      'https://wappsto.com/services/2.0/application?expand=2&verbose=true',
      {},
    );
  });

  test('create new empty wapp', async () => {
    mockAxios.get.mockResolvedValueOnce({ data: {} });
    mockAxios.post
      .mockResolvedValueOnce({
        data: {
          version: [
            {
              meta: { id: 'version_id' },
              author: 'author',
              description: {
                background: undefined,
                foreground: 'foreground',
                general: 'general',
                version: '',
                widget: '',
              },
              file: [],
              name: 'Test Wapp',
              status: 'idle',
              supported_features: ['foreground'],
              title: '',
              version_app: '1.1.1',
            },
          ],
        },
      })
      .mockResolvedValueOnce({ data: {} });

    const answer = {
      name: 'Test Wapp',
      author: 'author',
      version: '1.1.1',
      features: ['foreground'],
      general: 'general',
      foreground: 'foreground',
      examples: false,
    };

    mockInquirer([answer]);

    const wapp = new Wapp();
    await wapp.create();
    const manifest = loadJsonFile('manifest.json');

    expect(mockAxios.get).toHaveBeenCalledTimes(1);
    expect(mockAxios.get).toHaveBeenCalledWith(
      'https://wappsto.com/services/2.0/application?expand=2&verbose=true',
      {},
    );
    expect(mockAxios.post).toHaveBeenCalledTimes(2);
    expect(mockAxios.post).toHaveBeenCalledWith(
      'https://wappsto.com/services/2.0/application?verbose=true',
      {
        version: [
          {
            author: 'author',
            description: {
              background: undefined,
              foreground: 'foreground',
              general: 'general',
              version: '',
              widget: '',
            },
            file: [],
            name: 'Test Wapp',
            status: 'idle',
            supported_features: ['foreground'],
            title: '',
            version_app: '1.1.1',
          },
        ],
      },
      {},
    );
    expect(mockAxios.post).toHaveBeenCalledWith(
      'https://wappsto.com/services/2.0/installation',
      { application: 'version_id' },
      {},
    );
    expect(mockAxios.patch).toHaveBeenCalledTimes(0);

    expect(fileExists(`${wapp.cacheFolder}/application`)).toEqual(true);
    expect(fileExists(`${wapp.cacheFolder}/installation`)).toEqual(true);
    expect(fileExists('manifest.json')).toEqual(true);
    expect(directoryExists('foreground')).toEqual(true);
    expect(directoryExists('background')).toEqual(false);
    expect(fileExists('foreground/index.html')).toEqual(false);

    expect(manifest.name).toEqual(answer.name);
    expect(manifest.author).toEqual(answer.author);
    expect(manifest.version_app).toEqual(answer.version);
    expect(manifest.supported_features).toEqual(answer.features);
    expect(manifest.description.general).toEqual(answer.general);
    expect(manifest.description.foreground).toEqual(answer.foreground);
  });
});

/*

test('create new foreground example wapp', async (t) => {
  const wapp = new Wapp();

  const answer = {
    name: 'Test Wapp',
    author: 'author',
    version: '1.1.1',
    features: ['foreground'],
    general: 'general',
    foreground: 'foreground',
    examples: true,
  };

  mockInquirer([
    {
      override: true,
    },
    answer,
  ]);

  await wapp.create();

  t.deepEqual(files.fileExists(`${wapp.cacheFolder}/application`), true);
  t.deepEqual(files.fileExists(`${wapp.cacheFolder}/installation`), true);
  t.deepEqual(files.fileExists('manifest.json'), true);
  t.deepEqual(files.directoryExists('foreground'), true);
  t.deepEqual(files.directoryExists('background'), false);
  t.deepEqual(files.fileExists('foreground/index.html'), true);
  t.deepEqual(files.fileExists('background/package.json'), false);

  const manifest = files.loadJsonFile('manifest.json');
  t.deepEqual(manifest.name, answer.name);
  t.deepEqual(manifest.author, answer.author);
  t.deepEqual(manifest.version_app, answer.version);
  t.deepEqual(manifest.supported_features, answer.features);
  t.deepEqual(manifest.description.general, answer.general);
  t.deepEqual(manifest.description.foreground, answer.foreground);
  t.deepEqual(manifest.description.background, answer.background);
});

test('create new example wapp', async (t) => {
  const wapp = new Wapp();

  const answer = {
    name: 'Test Wapp',
    author: 'author',
    version: '1.1.1',
    features: ['foreground', 'background'],
    general: 'general',
    foreground: 'foreground',
    examples: true,
  };

  mockInquirer([
    {
      override: true,
    },
    answer,
  ]);

  await wapp.create();

  t.deepEqual(files.fileExists(`${wapp.cacheFolder}/application`), true);
  t.deepEqual(files.fileExists(`${wapp.cacheFolder}/installation`), true);
  t.deepEqual(files.fileExists('manifest.json'), true);
  t.deepEqual(files.directoryExists('foreground'), true);
  t.deepEqual(files.directoryExists('background'), true);
  t.deepEqual(files.fileExists('foreground/index.html'), true);
  t.deepEqual(files.fileExists('background/package.json'), true);

  const manifest = files.loadJsonFile('manifest.json');
  t.deepEqual(manifest.name, answer.name);
  t.deepEqual(manifest.author, answer.author);
  t.deepEqual(manifest.version_app, answer.version);
  t.deepEqual(manifest.supported_features, answer.features);
  t.deepEqual(manifest.description.general, answer.general);
  t.deepEqual(manifest.description.foreground, answer.foreground);
  t.deepEqual(manifest.description.background, answer.background);
});

test('download wapp', async (t) => {
  const wapp = new Wapp();
  // console.log = t.log;
  // console.debug = t.log;

  const answer = {
    create: 'download',
    wapp: 'application_id',
  };

  mockInquirer([
    {
      override: true,
    },
    answer,
  ]);

  await wapp.create();

  t.deepEqual(files.fileExists(`${wapp.cacheFolder}/application`), true);
  t.deepEqual(files.fileExists(`${wapp.cacheFolder}/installation`), true);
  t.deepEqual(files.fileExists('manifest.json'), true);
  t.deepEqual(files.directoryExists('foreground'), true);
  t.deepEqual(files.directoryExists('background'), true);
});

test('generate new wapp from local', async (t) => {
  const wapp = new Wapp();

  const answer = {
    create: 'generate',
  };

  mockInquirer([
    {
      override: false,
    },
    answer,
  ]);

  await wapp.create();

  t.deepEqual(files.fileExists(`${wapp.cacheFolder}/application`), true);
  t.deepEqual(files.fileExists(`${wapp.cacheFolder}/installation`), true);
  t.deepEqual(files.fileExists('manifest.json'), true);
  t.deepEqual(files.directoryExists('foreground'), true);
  t.deepEqual(files.directoryExists('background'), true);
});

test('create new custom wapp', async (t) => {
  const data = {
    foreground: 'customForeground',
    background: 'customBackground',
    host: 'https://customHost.com',
    port: 4000,
    cacheFolder: 'customFolder',
  };
  files.saveJsonFile('wappsto.json', data);

  Config.reload();

  const wapp = new Wapp();

  const answer = {
    username: 'user@wappsto.com',
    password: 'password',
    name: 'Test Wapp',
    author: 'author',
    version: '1.1.1',
    features: ['foreground'],
    general: 'general',
    foreground: 'customForeground',
    examples: false,
  };

  mockInquirer([answer]);

  await wapp.create();

  t.deepEqual(files.fileExists(`${wapp.cacheFolder}/application`), true);
  t.deepEqual(files.fileExists(`${wapp.cacheFolder}/installation`), true);
  t.deepEqual(files.fileExists('manifest.json'), true);
  t.deepEqual(files.directoryExists('customForeground'), true);
  t.deepEqual(files.directoryExists('customBackground'), false);
  t.deepEqual(files.directoryExists('background'), false);
  t.deepEqual(files.fileExists('customForeground/index.html'), false);

  const manifest = files.loadJsonFile('manifest.json');
  t.deepEqual(manifest.name, answer.name);
  t.deepEqual(manifest.author, answer.author);
  t.deepEqual(manifest.version_app, answer.version);
  t.deepEqual(manifest.supported_features, answer.features);
  t.deepEqual(manifest.description.general, answer.general);
  t.deepEqual(manifest.description.foreground, answer.foreground);
});

*/
