import axios from 'axios';
import prompts from 'prompts';
import Config from '../src/config';
import { loadFile, loadJsonFile, saveFile } from '../src/util/files';
import {
  allApplicationsResponse,
  applicationJson,
  applicationResponse,
  installationResponse,
  versionResponse,
} from './util/response';
import { createWapp, setup, teardown } from './util/setup';
// eslint-disable-next-line import/order
import create from '../src/cmd/create';

describe('Create', () => {
  let mockedAxios: jest.Mocked<typeof axios>;

  beforeEach(async () => {
    mockedAxios = await setup();
  });

  afterEach(() => {
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
            executable: {
              engine: 'node',
            },
            file: [],
            name: 'Wapp name',
            permission: {
              create: ['data', 'stream', 'network'],
            },
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

    expect(loadJsonFile(`${Config.cacheFolder()}application`)).toEqual(
      applicationJson
    );

    expect(loadJsonFile('./manifest.json')).toEqual({
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
      permission: {
        create: ['data', 'stream'],
        permit_to_send_email: false,
        permit_to_send_sms: false,
      },
    });

    expect(loadFile('.gitignore')).toEqual(
      '.wappsto-cli-cache/\nnode_modules\n'
    );
  });

  it('can download a old wapp', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        data: allApplicationsResponse,
      })
      .mockResolvedValueOnce({
        data: {},
      })
      .mockResolvedValueOnce({
        data: 'File 1',
      })
      .mockResolvedValueOnce({
        data: 'File 2',
      })
      .mockResolvedValueOnce({
        data: 'File 3',
      });

    prompts.inject(['download', '866ee500-6c8d-4ccb-a41e-ace97c7b2243']);

    saveFile('.gitignore', 'node_modules\ntest');

    await create([]);

    expect(loadFile('.gitignore')).toEqual(
      'node_modules\ntest\n.wappsto-cli-cache/\n'
    );

    expect(loadJsonFile(`${Config.cacheFolder()}application`)).toEqual({
      meta: {
        id: '866ee500-6c8d-4ccb-a41e-ace97c7b2243',
        revision: 1,
        type: 'application',
        version: '2.1',
        updated: '2021-05-07T09:43:01.527582Z',
      },
      name: 'Wapp name',
      application_product: [],
      oauth_client: [],
      oauth_external: [],
      version: [
        {
          meta: {
            id: '98e68cd8-74a6-4841-bdd4-70c29f068056',
            revision: 1,
            type: 'version',
            version: '2.1',
            updated: '2021-05-07T09:45:19.194614Z',
          },
          author: 'Wapp Author',
          description: {
            foreground: 'Wapp Foreground',
            general: 'Wapp description',
            version: '',
            widget: '',
          },
          executable: {
            engine: 'node',
            version: '12.16.3',
          },
          max_number_installation: 1,
          supported_features: ['foreground'],
          version_app: '1.2.3',
          status: 'idle',
          name: 'Wapp name',
          file: [
            expect.objectContaining({
              meta: {
                id: 'e3bd2eeb-c8cd-47f4-bd3a-825cd62fbcd4',
                revision: 7,
                type: 'file',
                version: '2.1',
                updated: '2021-05-11T08:08:57.524593Z',
              },
              name: 'index.html',
              type: 'text/html',
            }),
            expect.objectContaining({
              meta: {
                id: '0cb9cb4f-73ec-468c-a8e5-b88a8bd13fe9',
                revision: 6,
                type: 'file',
                version: '2.1',
                updated: '2021-05-07T09:45:19.355056Z',
              },
              name: 'main.js',
              type: 'application/javascript',
            }),
            expect.objectContaining({
              meta: {
                id: 'cbfcd17f-7690-4670-8567-241d00c01c61',
                revision: 6,
                type: 'file',
                version: '2.1',
                updated: '2021-05-07T09:45:19.350774Z',
              },
              name: 'package.json',
              type: 'text/json',
            }),
          ],
          used_files: {},
          permission: {
            create: ['data', 'stream'],
            permit_to_send_email: false,
            permit_to_send_sms: false,
          },
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
      permission: {
        create: ['data', 'stream'],
        permit_to_send_email: false,
        permit_to_send_sms: false,
      },
    });

    expect(mockedAxios.put).toHaveBeenCalledTimes(0);
    expect(mockedAxios.patch).toHaveBeenCalledTimes(0);
    expect(mockedAxios.post).toHaveBeenCalledTimes(0);
    expect(mockedAxios.get).toHaveBeenCalledTimes(6);
    expect(mockedAxios.get).toHaveBeenNthCalledWith(
      2,
      'https://wappsto.com/services/2.1/application?expand=2&verbose=true',
      {}
    );
    expect(mockedAxios.get).toHaveBeenNthCalledWith(
      3,
      'https://wappsto.com/services/2.1/file/e3bd2eeb-c8cd-47f4-bd3a-825cd62fbcd4',
      {
        responseType: 'stream',
      }
    );
    expect(mockedAxios.get).toHaveBeenNthCalledWith(
      4,
      'https://wappsto.com/services/2.1/file/0cb9cb4f-73ec-468c-a8e5-b88a8bd13fe9',
      {
        responseType: 'stream',
      }
    );
    expect(mockedAxios.get).toHaveBeenNthCalledWith(
      5,
      'https://wappsto.com/services/2.1/file/cbfcd17f-7690-4670-8567-241d00c01c61',
      {
        responseType: 'stream',
      }
    );
    expect(mockedAxios.get).toHaveBeenNthCalledWith(
      6,
      'https://wappsto.com/services/2.1/installation?expand=2&this_version_id=98e68cd8-74a6-4841-bdd4-70c29f068056',
      {}
    );
  });

  it('can generate a new wapp from an old wapp', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        data: [],
      })
      .mockResolvedValueOnce({
        data: versionResponse,
      })
      .mockResolvedValueOnce({
        data: installationResponse,
      })
      .mockResolvedValueOnce({
        data: versionResponse,
      })
      .mockResolvedValueOnce({
        data: applicationResponse,
      });
    mockedAxios.post
      .mockResolvedValueOnce({
        data: applicationResponse,
      })
      .mockResolvedValueOnce({
        data: installationResponse,
      })
      .mockResolvedValueOnce({
        data: {},
      })
      .mockResolvedValueOnce({
        data: {},
      });
    mockedAxios.patch
      .mockResolvedValueOnce({
        data: versionResponse,
      })
      .mockResolvedValueOnce({
        data: versionResponse,
      });

    prompts.inject([false, 'generate']);

    createWapp(true);

    await create([]);

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
        meta: {
          id: '98e68cd8-74a6-4841-bdd4-70c29f068056',
          revision: 1,
          type: 'version',
          updated: '2023-01-24T09:53:15.128304Z',
          version: '2.1',
        },
        name: 'Wapp name',
        permission: {
          create: ['data', 'stream'],
          permit_to_send_email: false,
          permit_to_send_sms: false,
        },
        status: 'idle',
        supported_features: ['foreground'],
        used_files: {},
        version_app: '1.2.3',
      },
      {}
    );
    expect(mockedAxios.patch).toHaveBeenNthCalledWith(
      2,
      'https://wappsto.com/services/2.1/installation/00ecb1bd-e794-42b1-b73f-9596319e5ac5',
      {
        restart: {
          new_process: true,
        },
      },
      {}
    );

    expect(mockedAxios.get).toHaveBeenCalledTimes(6);
    expect(mockedAxios.get).toHaveBeenNthCalledWith(
      2,
      'https://wappsto.com/services/2.1/application?expand=2&verbose=true',
      {}
    );
    expect(mockedAxios.get).toHaveBeenNthCalledWith(
      3,
      'https://wappsto.com/services/2.1/version/98e68cd8-74a6-4841-bdd4-70c29f068056?expand=2&verbose=true',
      {}
    );
    expect(mockedAxios.get).toHaveBeenNthCalledWith(
      4,
      'https://wappsto.com/services/2.1/installation?expand=2&this_version_id=98e68cd8-74a6-4841-bdd4-70c29f068056',
      {}
    );
    expect(mockedAxios.get).toHaveBeenNthCalledWith(
      5,
      'https://wappsto.com/services/2.1/version/98e68cd8-74a6-4841-bdd4-70c29f068056?expand=2&verbose=true',
      {}
    );
    expect(mockedAxios.get).toHaveBeenNthCalledWith(
      6,
      'https://wappsto.com/services/2.1/application/4c8ebb21-524b-4fc0-bbc5-015da2e5ca60?expand=2&verbose=true',
      {}
    );

    expect(mockedAxios.post).toHaveBeenCalledTimes(4);
    expect(mockedAxios.post).toHaveBeenNthCalledWith(
      1,
      'https://wappsto.com/services/2.1/application?verbose=true',
      {
        version: [
          {
            author: 'Wapp Author',
            description: {
              foreground: 'Wapp Foreground',
              general: 'Wapp description',
              version: '',
              widget: '',
            },
            executable: {
              engine: 'node',
            },
            permission: {
              create: ['data', 'stream', 'network'],
            },
            max_number_installation: 1,
            name: 'Wapp name',
            supported_features: ['foreground'],
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
    expect(mockedAxios.post).toHaveBeenNthCalledWith(
      3,
      'https://wappsto.com/services/2.1/version/98e68cd8-74a6-4841-bdd4-70c29f068056/file/foreground?verbose=true',
      expect.objectContaining({}),
      { headers: expect.objectContaining({}) }
    );
    expect(mockedAxios.post).toHaveBeenNthCalledWith(
      4,
      'https://wappsto.com/services/2.1/installation',
      { application: '98e68cd8-74a6-4841-bdd4-70c29f068056' },
      {}
    );

    expect(loadJsonFile(`${Config.cacheFolder()}application`)).toEqual(
      applicationJson
    );

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
      permission: {
        create: ['data', 'stream'],
        permit_to_send_email: false,
        permit_to_send_sms: false,
      },
    });

    expect(loadFile('.gitignore')).toEqual(
      '.wappsto-cli-cache/\nnode_modules\n'
    );
  });
});
