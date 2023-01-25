import HTTP from './util/http';
import { loadJsonFile, saveJsonFile } from './util/files';
import Config from './config';
import tui from './util/tui';
import Model from './model';

export default class Installation extends Model {
  token_installation: string = '';
  supported_features: string[] = [];

  constructor() {
    super('installation');
    this.load();
  }

  getAttributes() {
    return ['token_installation', 'supported_features'];
  }

  get session(): string {
    return this.session;
  }

  get token(): string {
    return this.token_installation;
  }

  get hasForeground(): boolean {
    return this.supported_features.indexOf('foreground') !== -1;
  }

  get hasBackground(): boolean {
    return this.supported_features.indexOf('background') !== -1;
  }

  async create(id: string): Promise<boolean> {
    try {
      const response = await HTTP.post(`${this.HOST}`, {
        application: id,
      });
      this.parse(response.data);
      this.save();
      return true;
    } catch (err) {
      /* istanbul ignore next */
      tui.showError('Failed to create installation', err);
      return false;
    }
  }

  async fetchById(id: string): Promise<boolean> {
    let ret = true;
    try {
      let url = `${this.HOST}?expand=2&this_version_id=${id}`;
      const response = await HTTP.get(url);
      if (response.data && response.data.length) {
        this.parse(response.data[0]);
        this.save();
      } else {
        tui.showError(`Failed to fetch installation by ID: ${id}`);
        ret = false;
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
      await HTTP.patch(`${this.HOST}/${this.id}`, {
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

  async deleteById(id: string): Promise<void> {
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