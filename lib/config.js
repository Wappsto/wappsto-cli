import { loadJsonFile } from './files.js';

let custom = loadJsonFile('wappsto.json');

export default class Config {
  static foreground() {
    return custom.foreground || 'foreground';
  }

  static background() {
    return custom.background || 'background';
  }

  static host() {
    return custom.host || 'https://wappsto.com';
  }

  static isCustomHost() {
    return !!custom.host;
  }

  static port() {
    return custom.port || 3000;
  }

  static cacheFolder() {
    if (custom.cacheFolder) {
      if (!custom.cacheFolder.endsWith('/')) {
        custom.cacheFolder += '/';
      }
      return custom.cacheFolder;
    }
    return '.wappsto-cli-cache/';
  }

  static reload() {
    custom = loadJsonFile('wappsto.json');
  }

  static browser() {
    return custom.browser || 'default';
  }
}
