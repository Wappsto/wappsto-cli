import { setup, teardown } from './util/setup';
import { saveJsonFile } from '../src/util/files';
import Config from '../src/config';

describe('config', () => {
  beforeEach(async () => {
    await setup();
  });

  afterEach(() => {
    teardown();
  });

  it('has default parameters', () => {
    expect(Config.foreground()).toEqual('foreground');
    expect(Config.background()).toEqual('background');
    expect(Config.host()).toEqual('https://wappsto.com');
    expect(Config.hostname()).toEqual('wappsto.com');
    expect(Config.port()).toEqual(3000);
    expect(Config.websocket()).toEqual('wss://wappsto.com');
    expect(Config.cacheFolder()).toEqual('.wappsto-cli-cache/');
    expect(Config.isCustomHost()).toEqual(false);
    expect(Config.browser()).toEqual('default');
    expect(Config.env()).toEqual('production');
    expect(Config.userSession()).toEqual(false);
  });

  it('can have custom parameters', () => {
    const data = {
      foreground: 'customForeground',
      background: 'customBackground',
      host: 'https://qa.wappsto.com',
      port: 4000,
      cacheFolder: 'customFolder',
      browser: 'customBrowser',
      userSession: true,
    };

    saveJsonFile('wappsto.json', data);

    Config.reload();

    expect(Config.foreground()).toEqual(data.foreground);
    expect(Config.background()).toEqual(data.background);
    expect(Config.host()).toEqual(data.host);
    expect(Config.hostname()).toEqual('qa.wappsto.com');
    expect(Config.port()).toEqual(data.port);
    expect(Config.cacheFolder()).toEqual(`${data.cacheFolder}/`);
    expect(Config.isCustomHost()).toEqual(true);
    expect(Config.browser()).toEqual(data.browser);
    expect(Config.env()).toEqual('testing');
    expect(Config.userSession()).toEqual(true);
  });

  it('have default parameters after reload', () => {
    expect(Config.isCustomHost()).toEqual(true);

    Config.reload();

    expect(Config.foreground()).toEqual('foreground');
    expect(Config.background()).toEqual('background');
    expect(Config.host()).toEqual('https://wappsto.com');
    expect(Config.port()).toEqual(3000);
    expect(Config.cacheFolder()).toEqual('.wappsto-cli-cache/');
    expect(Config.isCustomHost()).toEqual(false);
    expect(Config.userSession()).toEqual(false);
  });
});
