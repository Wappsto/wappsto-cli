import HTTP from './http.js';
import { deleteFile, saveFile, loadFile } from './files.js';
import Config from './config.js';

export default class Session {
  constructor() {
    this.HOST = `${Config.host()}/services/2.1/session`;
    this.cacheFolder = Config.cacheFolder();
  }

  async login(user, pass) {
    const response = await HTTP.post(this.HOST, {
      username: user,
      password: pass,
      remember_me: true,
    });

    this.set(response.data.meta.id);
  }

  get() {
    return this.session;
  }

  clear() {
    deleteFile(`${this.cacheFolder}session`);
    HTTP.removeHeader('x-session');
  }

  set(session) {
    this.session = session;
    saveFile(`${this.cacheFolder}session`, session);
    HTTP.setHeader('x-session', session);
  }

  setXSession() {
    this.session = loadFile(`${this.cacheFolder}session`);
    if (this.session) {
      HTTP.setHeader('x-session', this.session);
      return true;
    }
    return false;
  }

  async load() {
    try {
      await HTTP.get(this.HOST);
      return true;
    } catch (err) {
      this.clear();
    }

    return false;
  }

  async validate() {
    if (this.setXSession() && (await this.load())) {
      return true;
    }

    return false;
  }
}
