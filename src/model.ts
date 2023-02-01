import pick from 'lodash.pick';
import Config from './config';
import HTTP from './util/http';
import { deleteFile, saveFile, loadFile } from './util/files';
import tui from './util/tui';
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

  /* istanbul ignore next */
  public getAttributes(): string[] {
    return [];
  }

  toJSON(): any {
    tui.trace('model', 'toJSON', this);
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
    tui.trace('model', 'parse', data);
    try {
      Object.assign(this, pick(data, this.getAttributes().concat(['meta'])));
    } catch (e: any) {
      console.log(e);
    }
  }

  save(): void {
    tui.trace('model', 'save', this);
    let data = this.toJSON();
    if (typeof data !== 'string') {
      data = JSON.stringify(data);
    }
    saveFile(`${this.cacheFolder}${this.meta.type}`, data);
  }

  load(): void {
    tui.trace('model', 'load');
    let data = loadFile(`${this.cacheFolder}${this.meta.type}`);
    if (data) {
      try {
        data = JSON.parse(data);
      } catch (e) {}
      this.parse(data);
    }
  }

  clear(): void {
    tui.trace('model', 'clear');
    deleteFile(`${this.cacheFolder}${this.meta.type}`);
  }

  async fetch(): Promise<boolean> {
    tui.trace('model', 'fetch');
    try {
      const response = await HTTP.get(
        `${this.HOST}/${this.id}?expand=2&verbose=true`
      );
      this.parse(response.data);
      return true;
    } catch (err: any) {
      tui.showError(`Failed to fetch ${this.meta.type}`, err);
    }

    return false;
  }

  async update(): Promise<boolean> {
    let result = true;
    try {
      const response = await HTTP.patch(
        `${this.HOST}/${this.id}`,
        this.toJSON()
      );
      this.parse(response.data);
    } catch (err) {
      tui.showError(`Failed to update ${this.meta.type}: ${this.id}`, err);
      result = false;
    }
    return result;
  }

  async delete(): Promise<void> {
    tui.trace('model', 'delete');
    try {
      await HTTP.delete(`${this.HOST}/${this.id}`);
    } catch (err: any) {
      /* istanbul ignore next */
      switch (err.response.data.code) {
        case 300020:
          // Installation already deleted
          break;
        case 9900067:
          // Already deleted
          break;
        case 300024:
          throw Error('Can not delete application that is published!');
        default:
          /* istanbul ignore next */
          tui.showError(`Failed to delete ${this.meta.type}: ${this.id}`, err);
      }
    }
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

  trace(method: string, data?: any): void {
    tui.trace(this.meta.type || 'model', method, data);
  }
}
