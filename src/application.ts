import HTTP from './util/http';
import tui from './util/tui';
import Version from './version';
import Model from './model';
import File from './file';
import {
  Application21,
  OauthClient21,
  OauthExternal21,
  ApplicationProduct21,
} from './types/application.d';

export default class Application extends Model implements Application21 {
  name: string = '';
  version: (Version | string)[] = [];
  oauth_client: [] | [OauthClient21 | string] = [];
  oauth_external: (OauthExternal21 | string)[] = [];
  application_product: (ApplicationProduct21 | string)[] = [];

  constructor(data: any) {
    super('application');
    this.trace('constructor');
    this.parse(data);
  }

  getAttributes() {
    this.trace('getAttributes');
    return ['name', 'name_identifier', 'version'];
  }

  toJSON(): any {
    this.trace('toJSON', this);
    const data = super.toJSON();
    data.version = [];
    for (let i = 0; i < this.version.length; i += 1) {
      const ver = this.version[i];
      if (typeof ver !== 'string') {
        data.version.push(ver.toJSON());
      }
    }
    return data;
  }

  getVersion(): Version {
    this.trace('getVersion');
    if (this.version.length > 0) {
      const last = this.version[this.version.length - 1];
      if (typeof last !== 'string') {
        return last;
      }
    }
    /* istanbul ignore next */
    return new Version({}, this);
  }

  getOAuthExternal(): OauthExternal21[] {
    const oauth: OauthExternal21[] = [];
    this.oauth_external.forEach((o) => {
      if (typeof o !== 'string') {
        oauth.push(o);
      }
    });
    return oauth;
  }

  getOAuthClient(): OauthClient21[] {
    const oauth: OauthClient21[] = [];
    this.oauth_client.forEach((o) => {
      if (typeof o !== 'string') {
        oauth.push(o);
      }
    });
    return oauth;
  }

  parse(data: any): void {
    this.trace('parse', data);
    super.parse(data);
    const vs = this.version || [];
    this.version = [];
    vs.forEach((v: any) => {
      this.version.push(new Version(v, this));
    });
  }

  static async create(info: any): Promise<Application | undefined> {
    tui.trace('application', 'create', info);
    let result = undefined;
    let data: any;
    if (!info.description || info.object_requested) {
      data = {
        name: info.name,
        title: '',
        author: info.author,
        version_app: info.version,
        status: 'idle',
        description: {
          general: info.general,
          version: '',
          foreground: info.foreground,
          background: info.background,
          widget: '',
        },
        file: [],
        supported_features: info.features || info.supported_features,
        permission: info.permission,
      };
    } else {
      data = info;
    }
    if (!data.info) {
      delete data.icon;
    }

    try {
      const response = await HTTP.post(
        `${Model.getHost('application')}?verbose=true`,
        {
          version: [data],
        }
      );
      result = new Application(response.data);
    } catch (err) {
      /* istanbul ignore next */
      tui.showError('Failed to create the application', err);
    }
    return result;
  }

  async get(): Promise<any> {
    this.trace('get');
    let result = {};
    try {
      const response = await HTTP.get(
        `${this.HOST}/${this.id}?expand=2&verbose=true`
      );
      result = response.data;
    } catch (err) {
      /* istanbul ignore next */
      tui.showError(`Failed to get application: ${this.id}`, err);
    }
    return result;
  }

  async getAll(): Promise<Application[]> {
    this.trace('getAll');
    let result: Application[] = [];
    try {
      const response = await HTTP.get(`${this.HOST}?expand=2&verbose=true`);
      response.data.forEach((data: any) => {
        const app = new Application(data);
        result.push(app);
      });
    } catch (err) {
      /* istanbul ignore next */
      tui.showError('Failed to load all applications');
    }
    return result;
  }

  async createOauthExternal(oauth: any): Promise<void> {
    this.trace('createOauthExternal', oauth);
    if (this.oauth_external.length === 0) {
      try {
        await HTTP.post(`${this.HOST}/${this.id}/oauth_external`, oauth);
        tui.showMessage('External OAuth created');
      } catch (err) {
        tui.showError('Failed to create OAuth External', err);
      }
    } else {
      if (typeof this.oauth_external[0] !== 'string') {
        try {
          await HTTP.patch(
            `${this.HOST}/${this.id}/oauth_external/${this.oauth_external[0].meta.id}`,
            oauth
          );
          tui.showMessage('External OAuth updated');
        } catch (err) {
          tui.showError('Failed to update OAuth External', err);
        }
      } else {
        tui.showError(
          'Failed to update OAuth External, because old OAuth was not loaded correctly'
        );
      }
    }
  }

  async createOauthClient(oauth: any): Promise<void> {
    this.trace('createOauthClient');
    const newOauth = oauth;
    if (typeof oauth.redirect_uri === 'string') {
      newOauth.redirect_uri = [oauth.redirect_uri];
    }
    if (typeof oauth.path_access_token === 'string') {
      newOauth.path_access_token = [oauth.path_access_token];
    }
    try {
      await HTTP.post(`${this.HOST}/${this.id}/oauth_client`, oauth);
      tui.showMessage('OAuth Client created');
    } catch (err: any) {
      if (err.response.data.code === 500232) {
        try {
          await HTTP.patch(`${this.HOST}/${this.id}/oauth_client`, oauth);
          tui.showMessage('OAuth Client updated');
        } catch (patchErr) {
          tui.showError('Failed to create OAuth Client', patchErr);
        }
      } else {
        tui.showError('Failed to create OAuth Client', err);
      }
    }
  }

  syncFiles(): void {
    const files = this.getVersion().getFiles();
    files.forEach((file: File) => {
      file.syncModified();
    });
  }
}
