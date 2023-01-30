import axios from 'axios';
import prompts from 'prompts';
import { setup, teardown, createWapp } from './util/setup';
import {
  applicationResponse,
  installationResponse,
  allApplicationsResponse,
} from './util/response';
import {
  loadJsonFile,
  saveFile,
  saveJsonFile,
  createFolders,
  fileExists,
  directoryExists,
} from '../src/util/files';
import Config from '../src/config';
import update from '../src/cmd/update';

describe('Update', () => {
  let mockedAxios: jest.Mocked<typeof axios>;

  beforeEach(async () => {
    mockedAxios = await setup();
  });

  afterEach(() => {
    jest.clearAllMocks();
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
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.delete).toHaveBeenCalledTimes(0);
  });

  it('can update a wapp', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        data: [],
      })
      .mockResolvedValueOnce({
        data: installationResponse,
      })
      .mockResolvedValueOnce({
        data: [],
      })
      .mockResolvedValueOnce({
        data: [],
      });
    mockedAxios.patch
      .mockResolvedValueOnce({
        data: {},
      })
      .mockResolvedValueOnce({
        data: {},
      });
    mockedAxios.post
      .mockResolvedValueOnce({
        data: applicationResponse,
      })
      .mockResolvedValueOnce({
        data: installationResponse,
      });

    createWapp();

    prompts.inject([true, true, true]);

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
      },
      {}
    );
    expect(mockedAxios.patch).toHaveBeenNthCalledWith(
      2,
      'https://wappsto.com/services/2.1/installation/a3c75f15-5d07-4b97-ae8b-91e0d435e49c',
      { restart: { new_process: true } },
      {}
    );

    expect(mockedAxios.post).toHaveBeenCalledTimes(0);
    expect(mockedAxios.get).toHaveBeenCalledTimes(4);
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
      'https://wappsto.com/services/2.1/application/4c8ebb21-524b-4fc0-bbc5-015da2e5ca60?expand=2&verbose=true',
      {}
    );

    expect(mockedAxios.delete).toHaveBeenCalledTimes(0);
  });
});
