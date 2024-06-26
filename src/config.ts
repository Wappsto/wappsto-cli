import { JsonObjType } from './types/custom';
import { loadJsonFile } from './util/files';

class Config {
  custom: JsonObjType;

  constructor() {
    this.custom = loadJsonFile('wappsto.json');
  }

  foreground(): string {
    return this.custom.foreground || 'foreground';
  }

  background(): string {
    return this.custom.background || 'background';
  }

  host(): string {
    return this.custom.host || 'https://wappsto.com';
  }

  env(): string {
    if (this.host().includes('dev.')) {
      return 'development';
    }
    if (this.host().includes('qa.')) {
      return 'testing';
    }
    if (this.host().includes('staging.')) {
      return 'staging';
    }
    return 'production';
  }

  hostname(): string {
    return this.host().split('//')[1];
  }

  websocket(): string {
    return this.custom.websocket || `wss://${this.hostname()}`;
  }

  isCustomHost(): boolean {
    return !!this.custom.host;
  }

  port(): number {
    return this.custom.port || 3000;
  }

  cacheFolder(): string {
    if (this.custom.cacheFolder) {
      if (!this.custom.cacheFolder.endsWith('/')) {
        this.custom.cacheFolder += '/';
      }
      return this.custom.cacheFolder;
    }
    return '.wappsto-cli-cache/';
  }

  reload(): void {
    this.custom = loadJsonFile('wappsto.json');
  }

  browser(): string {
    return this.custom.browser || 'default';
  }

  userSession(): boolean {
    return this.custom.userSession || false;
  }

  adminSession(): boolean {
    return this.custom.admin || false;
  }

  webServer(): string {
    return this.custom.webServer || '';
  }
}

const config = new Config();
export default config;
