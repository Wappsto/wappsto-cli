import axios from 'axios';
import prompts from 'prompts';
import { setup, teardown, createWapp } from './util/setup';
import { applicationResponse, installationResponse } from './util/response';
import publish from '../src/cmd/publish';

describe('Publish', () => {
  let mockedAxios: jest.Mocked<typeof axios>;

  beforeEach(async () => {
    mockedAxios = await setup();
  });

  afterEach(() => {
    jest.clearAllMocks();
    teardown();
  });

  it('can show help for publish', async () => {
    const org = console.log;
    console.log = jest.fn();

    await publish(['--help']);
    expect(console.log).toHaveBeenCalledTimes(1);

    console.log = org;
  });

  it('can handle invalid input for publish', async () => {
    const org = console.log;
    console.log = jest.fn();

    await publish(['what']);
    expect(console.log).toHaveBeenCalledTimes(1);

    console.log = org;
  });

  it('will not publish missing wapp', async () => {
    await publish([]);

    expect(mockedAxios.patch).toHaveBeenCalledTimes(0);
    expect(mockedAxios.post).toHaveBeenCalledTimes(0);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.delete).toHaveBeenCalledTimes(0);
  });

  it('can publish a wapp', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        data: [],
      })
      .mockResolvedValueOnce({
        data: installationResponse,
      });
    mockedAxios.patch
      .mockResolvedValueOnce({
        data: {},
      })
      .mockResolvedValueOnce({
        data: {},
      });

    createWapp();

    prompts.inject(['2.2.2']);

    await publish([]);

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
        version_app: '2.2.2',
        file: [],
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
      'https://wappsto.com/services/2.1/version/98e68cd8-74a6-4841-bdd4-70c29f068056',
      {
        status: 'commit',
      },
      {}
    );

    expect(mockedAxios.post).toHaveBeenCalledTimes(0);
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    expect(mockedAxios.get).toHaveBeenNthCalledWith(
      2,
      'https://wappsto.com/services/2.1/application/4c8ebb21-524b-4fc0-bbc5-015da2e5ca60?expand=2&verbose=true',
      {}
    );

    expect(mockedAxios.delete).toHaveBeenCalledTimes(0);
  });
});