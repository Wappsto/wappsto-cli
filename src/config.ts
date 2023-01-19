import { loadJsonFile } from './files';

class Config {
  custom: any;

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
}

const config = new Config();
export default config;
