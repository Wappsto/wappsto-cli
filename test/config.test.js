import { deleteFile, saveJsonFile } from '../lib/files.js';
import Config from '../lib/config.js';

describe('config', () => {
  beforeEach(() => {
    deleteFile('wappsto.json');
    Config.reload();
  });

  test('Default parameters', () => {
    expect(Config.foreground()).toEqual('foreground');
    expect(Config.background()).toEqual('background');
    expect(Config.host()).toEqual('https://wappsto.com');
    expect(Config.port()).toEqual(3000);
    expect(Config.cacheFolder()).toEqual('.wappsto-cli-cache/');
    expect(Config.isCustomHost()).toEqual(false);
  });

  test('Custom Parameters', () => {
    const data = {
      foreground: 'customForeground',
      background: 'customBackground',
      host: 'customHost',
      port: 4000,
      cacheFolder: 'customFolder',
    };
    saveJsonFile('wappsto.json', data);

    Config.reload();

    expect(Config.foreground()).toEqual(data.foreground);
    expect(Config.background()).toEqual(data.background);
    expect(Config.host()).toEqual(data.host);
    expect(Config.port()).toEqual(data.port);
    expect(Config.cacheFolder()).toEqual(`${data.cacheFolder}/`);
    expect(Config.isCustomHost()).toEqual(true);
  });

  test('Default parameters after reload', () => {
    Config.reload();

    expect(Config.foreground()).toEqual('foreground');
    expect(Config.background()).toEqual('background');
    expect(Config.host()).toEqual('https://wappsto.com');
    expect(Config.port()).toEqual(3000);
    expect(Config.cacheFolder()).toEqual('.wappsto-cli-cache/');
    expect(Config.isCustomHost()).toEqual(false);
  });
});
