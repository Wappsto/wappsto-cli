import axios from 'axios';
import prompts from 'prompts';
import { setup, teardown, createWapp } from './util/setup';
import {
  applicationResponse,
  versionResponse,
  installationResponse,
  allApplicationsResponse,
} from './util/response';
import { loadJsonFile } from '../src/util/files';
import Config from '../src/config';
import configure from '../src/cmd/configure';

describe('Configure', () => {
  let mockedAxios: jest.Mocked<typeof axios>;

  beforeEach(async () => {
    mockedAxios = await setup();
  });

  afterEach(() => {
    jest.clearAllMocks();
    teardown();
  });

  it('can show help for configure', async () => {
    const org = console.log;
    console.log = jest.fn();

    await configure(['--help']);
    expect(console.log).toHaveBeenCalledTimes(1);

    console.log = org;
  });

  it('can handle invalid input for configure', async () => {
    const org = console.log;
    console.log = jest.fn();

    await configure(['what']);
    expect(console.log).toHaveBeenCalledTimes(1);

    console.log = org;
  });

  it('can handle change the permission', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: applicationResponse,
    });
    mockedAxios.patch.mockResolvedValueOnce({
      data: versionResponse,
    });

    createWapp();

    prompts.inject(['permissions', ['network'], true, true]);

    await configure([]);

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
        create: ['network'],
        permit_to_send_email: true,
        permit_to_send_sms: true,
      },
    });

    expect(mockedAxios.put).toHaveBeenCalledTimes(0);
    expect(mockedAxios.post).toHaveBeenCalledTimes(0);
    expect(mockedAxios.delete).toHaveBeenCalledTimes(0);
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    expect(mockedAxios.patch).toHaveBeenCalledTimes(1);

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
        file: [],
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
          create: ['network'],
          permit_to_send_email: true,
          permit_to_send_sms: true,
        },
        status: 'idle',
        supported_features: ['foreground'],
        used_files: {},
        version_app: '1.2.3',
      },
      {}
    );
  });
});
