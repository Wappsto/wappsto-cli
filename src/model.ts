import * as Sentry from '@sentry/node';
import pick from 'lodash.pick';
import Config from './config';
import HTTP from './util/http';
import { deleteFile, saveFile, loadFile } from './util/files';
import tui from './util/tui';
import Trace from './util/trace';
import { Meta21 } from './types/application.d';

export default class Model {
  meta: Meta21 = { id: '', type: '', version: '2.1', revision: 1, updated: '' };
  HOST: string;
  cacheFolder: string;

  constructor(type: string) {
    tui.trace('model', 'constructor');
    this.meta.type = type;
    this.HOST = Model.getHost(type);
    this.cacheFolder = Config.cacheFolder();
  }

  static getHost(type: string): string {
    return `${Config.host()}/services/2.1/${type}`;
  }

  get id(): string {
    return this.meta.id || '';
  }

  get revision(): number {
    return this.meta.revision || 1;
  }

  get url(): string {
    return `${this.HOST}/${this.id}`;
  }

  public getAttributes(): string[] {
    /* istanbul ignore next */
    return [];
  }

  toJSON(full: boolean = true): Record<string, any> {
    const meta = Object.assign(
      {},
      pick(this.meta, ['id', 'type', 'version', 'revision', 'updated'])
    );
    const json = Object.assign(
      { meta: meta },
      this.removeUndefined(pick(this, this.getAttributes()))
    );
    return json;
  }

  parse(data: any): void {
    try {
      Object.assign(this, pick(data, this.getAttributes().concat(['meta'])));
    } catch (err) {
      this.handleException(`Failed to parse data in ${this.meta.type}`, err);
    }
  }

  save(): void {
    saveFile(
      `${this.cacheFolder}${this.meta.type}`,
      JSON.stringify(this.toJSON())
    );
  }

  load(): void {
    let data = loadFile(`${this.cacheFolder}${this.meta.type}`);
    if (data) {
      try {
        data = JSON.parse(data);
      } catch (e) {}
      this.parse(data);
    }
  }

  clear(): void {
    deleteFile(`${this.cacheFolder}${this.meta.type}`);
  }

  async fetch(): Promise<boolean> {
    try {
      const response = await HTTP.get(`${this.url}?expand=2&verbose=true`);
      this.parse(response.data);
      return true;
    } catch (err: any) {
      this.handleException(`Failed to fetch ${this.meta.type}`, err);
    }

    return false;
  }

  async update(): Promise<boolean> {
    try {
      const response = await HTTP.patch(`${this.url}`, this.toJSON(false));
      this.parse(response.data);
      return true;
    } catch (err) {
      this.handleException(
        `Failed to update ${this.meta.type}: ${this.id}`,
        err
      );
    }
    return false;
  }

  async delete(): Promise<void> {
    try {
      await HTTP.delete(`${this.url}`);
    } catch (err: any) {
      this.handleException(
        `Failed to delete ${this.meta.type}: ${this.id}`,
        err
      );
    }
  }

  async upgradeVersion(): Promise<boolean> {
    if (this.meta.version === '2.0') {
      tui.showWarning(`Upgrading ${this.meta.type} to version 2.1`);
      if (await this.fetch()) {
        this.save();
      } else {
        return false;
      }
    }
    return true;
  }

  private removeUndefined(obj: Record<string, any>, deep = 10) {
    if (obj && deep > 0) {
      Object.keys(obj).forEach((key) => {
        const value = obj[key];
        const type = typeof value;
        if (type === 'object') {
          this.removeUndefined(value, (deep -= 1));
        } else if (type === 'undefined') {
          delete obj[key];
        }
      });
    }
    return obj;
  }

  trace(method: string, data?: any): Trace {
    return new Trace(this.meta.type || 'model', method, data);
  }

  static trace(type: string, method: string, data?: any): Trace {
    return new Trace(type, method, data);
  }

  handleException(msg: string, err: any): void {
    if (this.meta.type === 'session') {
      tui.showError(msg, err);
    } else {
      const errMsg = err.response?.data?.message || '';
      switch (err.response?.data?.code) {
        case 117000000:
          // do not print invalid session error
          break;
        case 300020:
          // Installation already deleted
          break;
        case 9900067:
          // Already deleted
          break;
        case 300098:
          tui.showError(errMsg);
          tui.showError(
            `Please visit ${Config.host()}/pricing for more information`
          );
          break;
        case 500070:
          tui.showError(errMsg);
          tui.showWarning(`Suggestions for Name Identifier: ${err.response.data.data?.suggestion_name_identifier}`);
          throw new Error('name_identifier');
        case 500089:
          tui.showError(
            `${msg} because you cannot publish a new version, before you old version have been approved.`
          );
          break;
        case 500090:
          tui.showError(
            `Failed to publish your wapp, because ${errMsg.toLowerCase()}`
          );
          break;
        case 9900147:
          tui.showError(`${msg} because it was not found on Wappsto`);
          break;
        case 300024:
          throw Error('Can not delete application that is published!');
        case 400006:
          tui.showError('You do not have permission to this wapp.');
          tui.showError('Try to logout and login with the correct user');
          break;
        default:
          Model.handleException(msg, err);
      }
    }
  }

  static handleException(msg: string, err: any): void {
    if (process.env.NODE_ENV !== 'test') {
      Sentry.captureException(err);
    }
    tui.showError(msg, err);
  }
}
