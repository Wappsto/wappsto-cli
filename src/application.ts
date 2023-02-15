import HTTP from './util/http';
import tui from './util/tui';
import Model from './model';
import Version from './version';
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
    this.parse(data);
  }

  getAttributes() {
    return ['name', 'name_identifier', 'version'];
  }

  toJSON(full: boolean = true): Record<string, any> {
    const data = super.toJSON(full);
    if (full) {
      data.version = [];
      for (let i = 0; i < this.version.length; i += 1) {
        const ver = this.version[i];
        if (typeof ver !== 'string') {
          data.version.push(ver.toJSON());
        }
      }
    } else {
      delete data.version;
    }
    return data;
  }

  getVersion(): Version {
    if (this.version.length > 0) {
      const idleVersions = this.version
        .filter((ver: Version | string) => {
          if (typeof ver !== 'string') {
            return ver.status === 'idle';
          }
          return false;
        })
        .sort((a, b) => {
          if (typeof a === 'string' || typeof b === 'string') {
            return 0;
          }

          // Asceding ordering
          var d1 = new Date(a.meta.updated || '');
          var d2 = new Date(b.meta.updated || '');
          if (d1 < d2) {
            return 1;
          }

          // d1 is greater than d2
          return -1;
        });

      if (typeof idleVersions[0] !== 'string') {
        return idleVersions[0];
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
    super.parse(data);
    const vs = this.version || [];
    this.version = [];
    vs.forEach((v: any) => {
      this.version.push(new Version(v, this));
    });
  }

  static async create(info: any): Promise<Application | undefined> {
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
    data.executable = {
      engine: 'node',
    };

    try {
      const response = await HTTP.post(
        `${Model.getHost('application')}?verbose=true`,
        {
          version: [data],
        }
      );
      result = new Application(response.data);
    } catch (err) {
      Model.handleException('Failed to create the application', err);
    }
    return result;
  }

  async get(): Promise<any> {
    try {
      const response = await HTTP.get(`${this.url}?expand=2&verbose=true`);
      return response.data;
    } catch (err) {
      this.handleException(`Failed to get application: ${this.id}`, err);
    }
    return {};
  }

  async getAll(): Promise<Application[]> {
    let result: Application[] = [];
    try {
      const response = await HTTP.get(`${this.HOST}?expand=2&verbose=true`);
      response.data.forEach((data: any) => {
        const app = new Application(data);
        result.push(app);
      });
    } catch (err) {
      Model.handleException('Failed to load all applications', err);
    }
    return result;
  }

  async createOauthExternal(oauth: any): Promise<void> {
    if (this.oauth_external.length === 0) {
      try {
        await HTTP.post(`${this.url}/oauth_external`, oauth);
        tui.showMessage('External OAuth created');
      } catch (err) {
        tui.showError('Failed to create OAuth External', err);
      }
    } else {
      if (typeof this.oauth_external[0] !== 'string') {
        try {
          await HTTP.patch(
            `${this.url}/oauth_external/${this.oauth_external[0].meta.id}`,
            oauth
          );
          tui.showMessage('External OAuth updated');
        } catch (err) {
          this.handleException('Failed to update OAuth External', err);
        }
      } else {
        tui.showError(
          'Failed to update OAuth External, because old OAuth was not loaded correctly'
        );
      }
    }
  }

  async createOauthClient(oauth: any): Promise<void> {
    const newOauth = oauth;
    if (typeof oauth.redirect_uri === 'string') {
      newOauth.redirect_uri = [oauth.redirect_uri];
    }
    if (typeof oauth.path_access_token === 'string') {
      newOauth.path_access_token = [oauth.path_access_token];
    }
    try {
      await HTTP.post(`${this.url}/oauth_client`, oauth);
      tui.showMessage('OAuth Client created');
    } catch (err: any) {
      if (err.response.data.code === 500232) {
        try {
          await HTTP.patch(`${this.url}/oauth_client`, oauth);
          tui.showMessage('OAuth Client updated');
        } catch (patchErr) {
          this.handleException('Failed to create OAuth Client', patchErr);
        }
      } else {
        this.handleException('Failed to create OAuth Client', err);
      }
    }
  }

  syncFiles(): void {
    const files = this.getVersion().getFiles();
    files.forEach((file: File) => {
      file.syncModified();
    });
  }

  async publish(newVersion: string, change: string): Promise<boolean> {
    const version = this.getVersion();
    version.version_app = newVersion;
    if (version.description) {
      version.description.version = change;
    }
    if (await version.update()) {
      return version.publish();
    }
    return false;
  }
}
