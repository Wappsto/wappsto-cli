const files = require('./files');

let custom = files.loadJsonFile('wappsto.json');

class Config {
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
    custom = files.loadJsonFile('wappsto.json');
  }

  static browser() {
    return custom.browser || 'default';
  }
}

module.exports = Config;
