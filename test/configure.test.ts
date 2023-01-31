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
});
