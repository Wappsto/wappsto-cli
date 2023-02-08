import HTTP from './util/http';
import tui from './util/tui';
import Model from './model';
import {
  Installation21,
  Oauth21,
  OauthConnect21,
} from './types/installation.d';

export default class Installation extends Model implements Installation21 {
  application: string = '';
  version_id: string = '';
  session_user: boolean = false;
  extsync: boolean = false;
  status: {
    background?:
      | 'no_background'
      | 'pending'
      | 'not_paid'
      | 'running'
      | 'crashed'
      | 'restarting'
      | 'error'
      | 'failed'
      | 'stopped'
      | 'completed'
      | 'no_more_points';
    version?: 'uninstalled' | 'not updated' | 'disabled' | 'updated' | 'editor';
    payment?: 'free' | 'owned' | 'pending' | 'paid' | 'not_paid';
  } = {};
  payment: {
    free?: boolean;
    status?: string;
    application_product_id?: string;
    created?: string;
    current_period_end?: string;
    current_period_start?: string;
    pending?: {
      [k: string]: unknown;
    };
    [k: string]: unknown;
  } = {};
  oauth: (Oauth21 | string)[] = [];
  oauth_connect: (OauthConnect21 | string)[] = [];
  session?: string;
  token_installation: string = '';
  supported_features: string[] = [];

  constructor() {
    super('installation');
    this.load();
  }

  getAttributes() {
    return [
      'token_installation',
      'supported_features',
      'application',
      'version_id',
      'session',
    ];
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
      this.handleException('Failed to create installation', err);
      return false;
    }
  }

  async fetchById(id: string): Promise<boolean> {
    try {
      let url = `${this.HOST}?expand=2&this_version_id=${id}`;
      const response = await HTTP.get(url);
      if (response.data && response.data.length) {
        this.parse(response.data[0]);
        this.save();
        return true;
      } else {
        tui.showError(`Failed to fetch installation by ID: ${id}`);
      }
    } catch (err) {
      this.handleException(`Failed to load installation: ${id}`, err);
    }
    return false;
  }

  async restart(): Promise<void> {
    try {
      await HTTP.patch(`${this.HOST}/${this.id}`, {
        restart: {
          new_process: true,
        },
      });
    } catch (err) {
      this.handleException(`Failed to restart installation: ${this.id}`, err);
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
      this.handleException(`Failed to reinstall installation: ${this.id}`, err);
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
      this.handleException(`Failed to stop installation: ${this.id}`, err);
      return false;
    }
  }

  async setExtSync(enableExtSync: boolean): Promise<void> {
    try {
      await HTTP.patch(`${this.HOST}/${this.id}`, {
        extsync: enableExtSync,
      });
    } catch (err) {
      this.handleException(
        `Failed to change ExtSync for installation: ${this.id}`,
        err
      );
    }
  }

  async deleteById(id: string): Promise<void> {
    try {
      await HTTP.delete(`${this.HOST}?this_version_id=${id}`);
    } catch (err: any) {
      switch (err.response.data.code) {
        case 300020:
          // Installation already deleted
          break;
        default:
          this.handleException(`Failed to delete installation: ${id}`, err);
      }
    }
  }
}
