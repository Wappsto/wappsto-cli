import axios from 'axios';
import { setup, teardown, createWapp } from './util/setup';
import {
  applicationResponse,
  installationResponse,
  versionResponse,
} from './util/response';
import update from '../src/cmd/update';
import { saveFile, createFolders } from '../src/util/files';
import Config from '../src/config';

describe('Update', () => {
  let mockedAxios: jest.Mocked<typeof axios>;

  beforeEach(async () => {
    mockedAxios = await setup();
  });

  afterEach(() => {
    teardown();
  });

  it('can show help for update', async () => {
    const org = console.log;
    console.log = jest.fn();

    await update(['--help']);
    expect(console.log).toHaveBeenCalledTimes(1);

    console.log = org;
  });

  it('can handle invalid input for update', async () => {
    const org = console.log;
    console.log = jest.fn();

    await update(['what']);
    expect(console.log).toHaveBeenCalledTimes(1);

    console.log = org;
  });

  it('will not update missing wapp', async () => {
    await update([]);

    expect(mockedAxios.patch).toHaveBeenCalledTimes(0);
    expect(mockedAxios.post).toHaveBeenCalledTimes(0);
    expect(mockedAxios.get).toHaveBeenCalledTimes(0);
    expect(mockedAxios.delete).toHaveBeenCalledTimes(0);
  });

  it('can update a wapp', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        data: versionResponse,
      })
      .mockResolvedValueOnce({
        data: [installationResponse],
      })
      .mockResolvedValueOnce({
        data: versionResponse,
      })
      .mockResolvedValueOnce({
        data: applicationResponse,
      });
    mockedAxios.patch
      .mockResolvedValueOnce({
        data: versionResponse,
      })
      .mockResolvedValueOnce({
        data: installationResponse,
      });
    mockedAxios.post
      .mockResolvedValueOnce({
        data: applicationResponse,
      })
      .mockResolvedValueOnce({
        data: installationResponse,
      });

    createWapp();

    await update([]);

    expect(mockedAxios.put).toHaveBeenCalledTimes(0);
    expect(mockedAxios.patch).toHaveBeenCalledTimes(2);
    expect(mockedAxios.patch).toHaveBeenNthCalledWith(
      1,
      'https://wappsto.com/services/2.1/version/98e68cd8-74a6-4841-bdd4-70c29f068056',
      {
        author: 'Wapp Author',
        description: {
          foreground: 'Wapp Foreground',
          general: 'Wapp description',
          version: '',
          widget: '',
        },
        max_number_installation: 1,
        name: 'Wapp name',
        supported_features: ['foreground'],
        version_app: '1.2.3',
        meta: {
          id: '98e68cd8-74a6-4841-bdd4-70c29f068056',
          revision: 1,
          type: 'version',
          version: '2.1',
        },
        status: 'idle',
        used_files: {},
      },
      {}
    );
    expect(mockedAxios.patch).toHaveBeenNthCalledWith(
      2,
      'https://wappsto.com/services/2.1/installation/00ecb1bd-e794-42b1-b73f-9596319e5ac5',
      { restart: { new_process: true } },
      {}
    );

    expect(mockedAxios.post).toHaveBeenCalledTimes(0);
    expect(mockedAxios.get).toHaveBeenCalledTimes(5);
    expect(mockedAxios.get).toHaveBeenNthCalledWith(
      2,
      'https://wappsto.com/services/2.1/version/98e68cd8-74a6-4841-bdd4-70c29f068056?expand=2&verbose=true',
      {}
    );
    expect(mockedAxios.get).toHaveBeenNthCalledWith(
      3,
      'https://wappsto.com/services/2.1/installation?expand=2&this_version_id=98e68cd8-74a6-4841-bdd4-70c29f068056',
      {}
    );
    expect(mockedAxios.get).toHaveBeenNthCalledWith(
      4,
      'https://wappsto.com/services/2.1/version/98e68cd8-74a6-4841-bdd4-70c29f068056?expand=2&verbose=true',
      {}
    );
    expect(mockedAxios.get).toHaveBeenNthCalledWith(
      5,
      'https://wappsto.com/services/2.1/application/4c8ebb21-524b-4fc0-bbc5-015da2e5ca60?expand=2&verbose=true',
      {}
    );

    expect(mockedAxios.delete).toHaveBeenCalledTimes(0);
  });

  it('can update a file', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        data: versionResponse,
      })
      .mockResolvedValueOnce({
        data: [installationResponse],
      })
      .mockResolvedValueOnce({
        data: versionResponse,
      })
      .mockResolvedValueOnce({
        data: applicationResponse,
      });
    mockedAxios.patch
      .mockResolvedValueOnce({
        data: versionResponse,
      })
      .mockResolvedValueOnce({
        data: installationResponse,
      });
    mockedAxios.post
      .mockResolvedValueOnce({
        data: applicationResponse,
      })
      .mockResolvedValueOnce({
        data: installationResponse,
      });

    createWapp();

    const testFile = `${Config.foreground()}/test_file.js`;
    createFolders(testFile);
    saveFile(testFile, 'test file data');

    await update([]);

    expect(mockedAxios.put).toHaveBeenCalledTimes(0);
    expect(mockedAxios.patch).toHaveBeenCalledTimes(2);
    expect(mockedAxios.patch).toHaveBeenNthCalledWith(
      1,
      'https://wappsto.com/services/2.1/version/98e68cd8-74a6-4841-bdd4-70c29f068056',
      {
        author: 'Wapp Author',
        description: {
          foreground: 'Wapp Foreground',
          general: 'Wapp description',
          version: '',
          widget: '',
        },
        max_number_installation: 1,
        name: 'Wapp name',
        supported_features: ['foreground'],
        version_app: '1.2.3',
        meta: {
          id: '98e68cd8-74a6-4841-bdd4-70c29f068056',
          revision: 1,
          type: 'version',
          version: '2.1',
        },
        status: 'idle',
        used_files: {},
      },
      {}
    );
    expect(mockedAxios.patch).toHaveBeenNthCalledWith(
      2,
      'https://wappsto.com/services/2.1/installation/00ecb1bd-e794-42b1-b73f-9596319e5ac5',
      { restart: { new_process: true } },
      {}
    );

    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    expect(mockedAxios.post).toHaveBeenNthCalledWith(
      1,
      'https://wappsto.com/services/2.1/version/98e68cd8-74a6-4841-bdd4-70c29f068056/file/foreground?verbose=true',
      expect.objectContaining({}),
      {headers: expect.objectContaining({})}
    );
    expect(mockedAxios.get).toHaveBeenCalledTimes(5);
    expect(mockedAxios.get).toHaveBeenNthCalledWith(
      2,
      'https://wappsto.com/services/2.1/version/98e68cd8-74a6-4841-bdd4-70c29f068056?expand=2&verbose=true',
      {}
    );
    expect(mockedAxios.get).toHaveBeenNthCalledWith(
      3,
      'https://wappsto.com/services/2.1/installation?expand=2&this_version_id=98e68cd8-74a6-4841-bdd4-70c29f068056',
      {}
    );
    expect(mockedAxios.get).toHaveBeenNthCalledWith(
      4,
      'https://wappsto.com/services/2.1/version/98e68cd8-74a6-4841-bdd4-70c29f068056?expand=2&verbose=true',
      {}
    );
    expect(mockedAxios.get).toHaveBeenNthCalledWith(
      5,
      'https://wappsto.com/services/2.1/application/4c8ebb21-524b-4fc0-bbc5-015da2e5ca60?expand=2&verbose=true',
      {}
    );

    expect(mockedAxios.delete).toHaveBeenCalledTimes(0);
  });
});
