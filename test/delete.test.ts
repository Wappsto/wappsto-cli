import axios from 'axios';
import prompts from 'prompts';
import { setup, teardown, createWapp } from './util/setup';
import { applicationResponse, installationResponse } from './util/response';
import { fileExists, directoryExists } from '../src/util/files';
import Config from '../src/config';
import Delete from '../src/cmd/delete';

describe('Delete', () => {
  let mockedAxios: jest.Mocked<typeof axios>;

  beforeEach(async () => {
    mockedAxios = await setup();
  });

  afterEach(() => {
    teardown();
  });

  it('can show help for delete', async () => {
    const org = console.log;
    console.log = jest.fn();

    await Delete(['--help']);
    expect(console.log).toHaveBeenCalledTimes(1);

    console.log = org;
  });

  it('can handle invalid input for delete', async () => {
    const org = console.log;
    console.log = jest.fn();

    await Delete(['what']);
    expect(console.log).toHaveBeenCalledTimes(1);

    console.log = org;
  });

  it('will not delete when user breaks', async () => {
    createWapp();

    prompts.inject([new Error('abort')]);

    await Delete([]);

    expect(mockedAxios.post).toHaveBeenCalledTimes(0);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.delete).toHaveBeenCalledTimes(0);
  });

  it('will not delete missing wapp', async () => {
    await Delete([]);

    expect(mockedAxios.post).toHaveBeenCalledTimes(0);
    expect(mockedAxios.get).toHaveBeenCalledTimes(0);
    expect(mockedAxios.delete).toHaveBeenCalledTimes(0);
  });

  it('will not delete when answering no', async () => {
    createWapp();

    prompts.inject([true, false, false]);

    await Delete([]);

    expect(mockedAxios.post).toHaveBeenCalledTimes(0);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.delete).toHaveBeenCalledTimes(0);
  });

  it('can delete a wapp', async () => {
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
    mockedAxios.delete.mockResolvedValue({
      data: {},
    });

    createWapp();

    prompts.inject([true, true, true]);

    await Delete([]);

    expect(fileExists('manifest.json')).toBe(false);
    expect(fileExists(`${Config.cacheFolder()}/application`)).toBe(false);
    expect(fileExists(`${Config.cacheFolder()}/installation`)).toBe(false);
    expect(directoryExists('foreground')).toBe(false);
    expect(directoryExists('background')).toBe(false);
    expect(directoryExists('icon')).toBe(false);

    expect(directoryExists(Config.cacheFolder())).toBe(true);
    expect(fileExists(`${Config.cacheFolder()}/session`)).toBe(true);

    expect(mockedAxios.post).toHaveBeenCalledTimes(0);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.delete).toHaveBeenCalledTimes(3);
    expect(mockedAxios.delete).toHaveBeenNthCalledWith(
      1,
      'https://wappsto.com/services/2.1/version/98e68cd8-74a6-4841-bdd4-70c29f068056',
      {}
    );
    expect(mockedAxios.delete).toHaveBeenNthCalledWith(
      2,
      'https://wappsto.com/services/2.1/installation?this_version_id=98e68cd8-74a6-4841-bdd4-70c29f068056',
      {}
    );
    expect(mockedAxios.delete).toHaveBeenNthCalledWith(
      3,
      'https://wappsto.com/services/2.1/application/4c8ebb21-524b-4fc0-bbc5-015da2e5ca60',
      {}
    );
  });

  it('can handle deleting failed', async () => {
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
    mockedAxios.delete.mockRejectedValue({
      data: {},
    });

    createWapp();

    prompts.inject([true, true, true]);

    await Delete([]);

    expect(mockedAxios.post).toHaveBeenCalledTimes(0);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.delete).toHaveBeenCalledTimes(3);
    expect(mockedAxios.delete).toHaveBeenNthCalledWith(
      1,
      'https://wappsto.com/services/2.1/version/98e68cd8-74a6-4841-bdd4-70c29f068056',
      {}
    );
    expect(mockedAxios.delete).toHaveBeenNthCalledWith(
      2,
      'https://wappsto.com/services/2.1/installation?this_version_id=98e68cd8-74a6-4841-bdd4-70c29f068056',
      {}
    );
    expect(mockedAxios.delete).toHaveBeenNthCalledWith(
      3,
      'https://wappsto.com/services/2.1/application/4c8ebb21-524b-4fc0-bbc5-015da2e5ca60',
      {}
    );
  });
});
