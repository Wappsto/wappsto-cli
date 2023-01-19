import HTTP from './http';
import { loadJsonFile, saveJsonFile } from './files';
import Config from './config';
import tui from './tui';

export default class Installation {
  HOST: string;
  HOST_21: string;
  cacheFolder: string;
  json: any;

  constructor() {
    this.HOST = `${Config.host()}/services/2.0/installation`;
    this.HOST_21 = `${Config.host()}/services/2.1/installation`;
    this.cacheFolder = Config.cacheFolder();
    this.json = loadJsonFile(`${this.cacheFolder}installation`);
  }

  save(): void {
    saveJsonFile(`${this.cacheFolder}installation`, this.json);
  }

  get data(): any {
    return this.json;
  }

  get session(): string {
    return this.json.session;
  }

  get id(): string {
    return this.json.meta.id;
  }

  get token(): string {
    return this.json.token_installation;
  }

  get hasForeground(): boolean {
    return this.json.supported_features.indexOf('foreground') !== -1;
  }

  get hasBackground(): boolean {
    return this.json.supported_features.indexOf('background') !== -1;
  }

  async create(id: string): Promise<boolean> {
    try {
      const response = await HTTP.post(`${this.HOST}`, {
        application: id,
      });
      this.json = response.data;
      this.save();
      return true;
    } catch (err) {
      /* istanbul ignore next */
      tui.showError('Failed to create installation', err);
      return false;
    }
  }

  async load(id: string): Promise<boolean> {
    let ret = true;
    try {
      let url = `${this.HOST}?expand=2`;
      if (id) {
        url += `&this_version_id=${id}`;
      }
      const response = await HTTP.get(url);
      if (response.data && response.data.length) {
        this.json = response.data[0];
        this.save();
      } else {
        ret = await this.create(id);
      }
    } catch (err) {
      /* istanbul ignore next */
      tui.showError(`Failed to load installation: ${id}`, err);
      ret = false;
    }
    return ret;
  }

  async restart(): Promise<void> {
    try {
      await HTTP.patch(`${this.HOST}/${this.id}`, {
        restart: {
          new_process: true,
        },
      });
    } catch (err) {
      /* istanbul ignore next */
      tui.showError(`Failed to restart installation: ${this.id}`, err);
    }
  }

  async reinstall(): Promise<void> {
    try {
      await HTTP.patch(`${this.HOST}/${this.id}`, {
        restart: {
          new_process: true,
          new_user: true,
        },
      });
    } catch (err) {
      /* istanbul ignore next */
      tui.showError(`Failed to reinstall installation: ${this.id}`, err);
    }
  }

  async stop(): Promise<boolean> {
    try {
      await HTTP.patch(`${this.HOST_21}/${this.id}`, {
        restart: {
          stop_background: true,
        },
      });
      return true;
    } catch (err) {
      /* istanbul ignore next */
      tui.showError(`Failed to stop installation: ${this.id}`, err);
      return false;
    }
  }

  async setExtSync(enableExtSync: boolean): Promise<void> {
    try {
      await HTTP.patch(`${this.HOST}/${this.id}`, {
        extsync: enableExtSync,
      });
    } catch (err) {
      /* istanbul ignore next */
      tui.showError(
        `Failed to change ExtSync for installation: ${this.id}`,
        err
      );
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await HTTP.delete(`${this.HOST}?this_version_id=${id}`);
    } catch (err: any) {
      /* istanbul ignore next */
      switch (err.response.data.code) {
        case 300020:
          // Installation already deleted
          break;
        default:
          /* istanbul ignore next */
          tui.showError(`Failed to delete installation: ${id}`, err);
      }
    }
  }
}
