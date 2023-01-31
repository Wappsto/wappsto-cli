import axios from 'axios';
import prompts from 'prompts';
import { setup, teardown } from './util/setup';
import {
  applicationResponse,
  installationResponse,
  allApplicationsResponse,
} from './util/response';
import { loadJsonFile } from '../src/util/files';
import Config from '../src/config';
import serve from '../src/cmd/serve';

describe('Serve', () => {
  let mockedAxios: jest.Mocked<typeof axios>;

  beforeEach(async () => {
    mockedAxios = await setup();
  });

  afterEach(() => {
    jest.clearAllMocks();
    teardown();
  });

  it('can show help for serve', async () => {
    const org = console.log;
    console.log = jest.fn();

    await serve(['--help']);
    expect(console.log).toHaveBeenCalledTimes(1);

    console.log = org;
  });

  it('can handle invalid input for serve', async () => {
    const org = console.log;
    console.log = jest.fn();

    await serve(['what']);
    expect(console.log).toHaveBeenCalledTimes(1);

    console.log = org;
  });
});
