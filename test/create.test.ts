import axios from 'axios';
import prompts from 'prompts';
import { setup, teardown } from './util/setup';
import {
  applicationResponse,
  installationResponse,
  allApplicationsResponse,
} from './util/response';
import { loadJsonFile, saveFile, createFolders } from '../src/util/files';
import Config from '../src/config';
import create from '../src/cmd/create';

describe('Create', () => {
  let mockedAxios: jest.Mocked<typeof axios>;

  beforeEach(async () => {
    mockedAxios = await setup();
  });

  afterEach(() => {
    jest.clearAllMocks();
    teardown();
  });

  it('can show help for create', async () => {
    const org = console.log;
    console.log = jest.fn();

    await create(['--help']);
    expect(console.log).toHaveBeenCalledTimes(1);

    console.log = org;
  });

  it('can handle invalid input for create', async () => {
    const org = console.log;
    console.log = jest.fn();

    await create(['what']);
    expect(console.log).toHaveBeenCalledTimes(1);

    console.log = org;
  });

  it('can create a new wapp', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: [],
    });
    mockedAxios.post
      .mockResolvedValueOnce({
        data: applicationResponse,
      })
      .mockResolvedValueOnce({
        data: installationResponse,
      });

    prompts.inject([
      'Wapp name',
      'Wapp Author',
      '1.2.3',
      ['foreground'],
      'Wapp description',
      'Wapp Foreground',
      false,
    ]);

    await create([]);

    const application_file = loadJsonFile(
      `${Config.cacheFolder()}/application`
    );
    const version_file = loadJsonFile(`${Config.cacheFolder()}/version`);
    const manifest_file = loadJsonFile('./manifest.json');

    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    expect(mockedAxios.get).toHaveBeenNthCalledWith(
      2,
      'https://wappsto.com/services/2.1/application?expand=2&verbose=true',
      {}
    );

    expect(mockedAxios.post).toHaveBeenCalledTimes(2);
    expect(mockedAxios.post).toHaveBeenNthCalledWith(
      1,
      'https://wappsto.com/services/2.1/application?verbose=true',
      {
        version: [
          {
            author: 'Wapp Author',
            description: {
              background: undefined,
              foreground: 'Wapp Foreground',
              general: 'Wapp description',
              version: '',
              widget: '',
            },
            file: [],
            name: 'Wapp name',
            permission: undefined,
            status: 'idle',
            supported_features: ['foreground'],
            title: '',
            version_app: '1.2.3',
          },
        ],
      },
      {}
    );
    expect(mockedAxios.post).toHaveBeenNthCalledWith(
      2,
      'https://wappsto.com/services/2.1/installation',
      {
        application: '98e68cd8-74a6-4841-bdd4-70c29f068056',
      },
      {}
    );

    expect(application_file).toEqual({
      meta: {
        id: '4c8ebb21-524b-4fc0-bbc5-015da2e5ca60',
        revision: 1,
        type: 'application',
        version: '2.1',
      },
      name: 'Wapp name',
      version: [
        {
          meta: {
            id: '98e68cd8-74a6-4841-bdd4-70c29f068056',
            revision: 1,
            type: 'version',
            version: '2.1',
          },
          author: 'Wapp Author',
          description: {
            foreground: 'Wapp Foreground',
            general: 'Wapp description',
            version: '',
            widget: '',
          },
          max_number_installation: 1,
          supported_features: ['foreground'],
          version_app: '1.2.3',
          name: 'Wapp name',
        },
      ],
    });

    expect(manifest_file).toEqual({
      name: 'Wapp name',
      author: 'Wapp Author',
      version_app: '1.2.3',
      supported_features: ['foreground'],
      max_number_installation: 1,
      description: {
        general: 'Wapp description',
        foreground: 'Wapp Foreground',
        version: '',
        widget: '',
      },
    });
  });

  it('can download a old wapp', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        data: allApplicationsResponse,
      })
      .mockResolvedValueOnce({
        data: {},
      });

    prompts.inject(['download', '866ee500-6c8d-4ccb-a41e-ace97c7b2243']);

    await create([]);

    const application_file = loadJsonFile(
      `${Config.cacheFolder()}/application`
    );
    expect(application_file).toEqual({
      meta: {
        id: '866ee500-6c8d-4ccb-a41e-ace97c7b2243',
        revision: 1,
        type: 'application',
        version: '2.1',
      },
      name: 'Wapp name',
      version: [
        {
          meta: {
            id: '98e68cd8-74a6-4841-bdd4-70c29f068056',
            revision: 1,
            type: 'version',
            version: '2.1',
          },
          author: 'Wapp Author',
          description: {
            foreground: 'Wapp Foreground',
            general: 'Wapp description',
            version: '',
            widget: '',
          },
          max_number_installation: 1,
          supported_features: ['foreground'],
          version_app: '1.2.3',
          name: 'Wapp name',
        },
      ],
    });

    const manifest_file = loadJsonFile('./manifest.json');
    expect(manifest_file).toEqual({
      name: 'Wapp name',
      author: 'Wapp Author',
      version_app: '1.2.3',
      supported_features: ['foreground'],
      max_number_installation: 1,
      description: {
        general: 'Wapp description',
        foreground: 'Wapp Foreground',
        version: '',
        widget: '',
      },
    });

    expect(mockedAxios.post).toHaveBeenCalledTimes(0);
    expect(mockedAxios.get).toHaveBeenCalledTimes(3);
    expect(mockedAxios.get).toHaveBeenNthCalledWith(
      2,
      'https://wappsto.com/services/2.1/application?expand=2&verbose=true',
      {}
    );
    expect(mockedAxios.get).toHaveBeenNthCalledWith(
      3,
      'https://wappsto.com/services/2.1/installation?expand=2&this_version_id=98e68cd8-74a6-4841-bdd4-70c29f068056',
      {}
    );
  });
});
