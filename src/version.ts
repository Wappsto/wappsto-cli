import HTTP from './http';
import Config from './config';
import tui from './tui';
import { getFilePath } from './util';

export default class Version {
  HOST: string;
  data: any;
  file: any[];
  application: any;
  id: string = '';
  revision: string = '';

  constructor(data?: any, parent?: any) {
    this.HOST = `${Config.host()}/services/2.0/version`;
    this.data = data;
    this.file = [];
    this.application = parent;
    if (data && data.meta) {
      this.id = data.meta.id;
      this.revision = data.meta.revision;
      if (data.file) {
        this.file = data.file.filter((el: any) => el != null);
      }
    }
  }

  getJSON(): any {
    return this.data;
  }

  async get(): Promise<any> {
    try {
      const response = await HTTP.get(
        `${this.HOST}/${this.id}?expand=2&verbose=true`
      );
      return new Version(response.data);
    } catch (err) {
      tui.showError(`Failed to get version: ${this.id}`, err);
    }
    return null;
  }

  findFile(filePath: string): any {
    return this.file.find(
      (file) => filePath === `${getFilePath(file.use)}/${file.name}`
    );
  }

  async update(version: any): Promise<boolean> {
    let result = true;
    try {
      const tmp = version;
      delete tmp.barebone;
      delete tmp.barebone_version;
      await HTTP.patch(`${this.HOST}/${this.id}`, tmp);
    } catch (err) {
      tui.showError(`Failed to update version: ${this.id}`, err);
      result = false;
    }
    return result;
  }

  updateFile(filePath: string, newFile: string): void {
    for (let i = 0; i < this.file.length; i += 1) {
      if (
        filePath === `${getFilePath(this.file[i].use)}/${this.file[i].name}`
      ) {
        this.file[i] = newFile;
        this.data.file[i] = newFile;
        this.application.save();
        return;
      }
    }
  }

  async delete(): Promise<void> {
    try {
      await HTTP.delete(`${this.HOST}/${this.id}`);
    } catch (err: any) {
      /* istanbul ignore next */
      switch (err.response.data.code) {
        case 9900067:
          // Version already deleted
          break;
        default:
          tui.showError(`Failed to delete version: ${this.id}`, err);
      }
    }
  }
}
