import Config from './config';
import HTTP from './http';
import { deleteFile, saveFile, loadFile } from './files';
import tui from './tui';

export default class Model {
  type: string;
  HOST: string;
  cacheFolder: string;

  constructor(type: string) {
    this.type = type;
    this.HOST = `${Config.host()}/services/2.1/${type}`;
    this.cacheFolder = Config.cacheFolder();
  }

  toJSON(): any {
    return {};
  }

  parse(data: any): void {}

  save(): void {
    saveFile(`${this.cacheFolder}${this.type}`, this.toJSON());
  }

  load(): void {
    const data = loadFile(`${this.cacheFolder}${this.type}`);
    if(data) {
      this.parse(data);
    }
  }

  clear(): void {
    deleteFile(`${this.cacheFolder}${this.type}`);
  }

  async fetch(): Promise<boolean> {
    try {
      const response = await HTTP.get(this.HOST);
      this.parse(response.data);
      return true;
    } catch (err: any) {
      tui.showError(`Failed to fetch ${this.type}`, err);
    }

    return false;
  }
}
