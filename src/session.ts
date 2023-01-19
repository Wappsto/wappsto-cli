import HTTP from './http';
import { deleteFile, saveFile, loadFile } from './files';
import Config from './config';

export default class Session {
  HOST: string;
  cacheFolder: string;
  session: string | false;

  constructor() {
    this.HOST = `${Config.host()}/services/2.1/session`;
    this.cacheFolder = Config.cacheFolder();
    this.session = false;
  }

  async login(user: string, pass: string): Promise<void> {
    const response = await HTTP.post(this.HOST, {
      username: user,
      password: pass,
      remember_me: true,
    });
    this.set(response.data.meta.id);
  }

  get(): string | false {
    return this.session;
  }

  clear(): void {
    deleteFile(`${this.cacheFolder}session`);
    HTTP.removeHeader('x-session');
  }

  set(session: string): void {
    this.session = session;
    saveFile(`${this.cacheFolder}session`, session);
    HTTP.setHeader('x-session', session);
  }

  setXSession(): boolean {
    this.session = loadFile(`${this.cacheFolder}session`);
    if (this.session) {
      HTTP.setHeader('x-session', this.session);
      return true;
    }
    return false;
  }

  async load(): Promise<boolean> {
    try {
      await HTTP.get(this.HOST);
      return true;
    } catch (err) {
      this.clear();
    }

    return false;
  }

  async validate(): Promise<boolean> {
    if (this.setXSession() && (await this.load())) {
      return true;
    }
    return false;
  }
}
