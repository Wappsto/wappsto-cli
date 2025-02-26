import { AxiosError } from 'axios';
import File from './file';
import Model from './model';
import {
  Application21,
  ApplicationProduct21,
  OauthClient21,
  OauthExternal21,
} from './types/application.d';
import { JsonObjType } from './types/custom';
import HTTP from './util/http';
import tui from './util/tui';
import Version from './version';

export default class Application extends Model implements Application21 {
  name = '';
  name_identifier?: string;
  version: (Version | string)[] = [];
  oauth_client: [] | [OauthClient21 | string] = [];
  oauth_external: (OauthExternal21 | string)[] = [];
  application_product: (ApplicationProduct21 | string)[] = [];

  constructor(data: Application21) {
    super('application');
    this.parse(data);
  }

  getAttributes() {
    return [
      'name',
      'name_identifier',
      'version',
      'oauth_client',
      'oauth_external',
      'application_product',
    ];
  }

  toJSON(full = true): Application21 {
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

  private findVersionByStatus(status: string): Version | null {
    if (this.version.length > 0) {
      const findIdle = () => {
        return this.version
          .filter((ver: Version | string) => {
            if (typeof ver !== 'string') {
              return ver.status === status;
            }
            return false;
          })
          .sort((a, b) => {
            if (typeof a === 'string' || typeof b === 'string') {
              return 0;
            }

            // Ascending ordering
            const d1 = new Date(a.meta.updated || '');
            const d2 = new Date(b.meta.updated || '');
            if (d1 < d2) {
              return 1;
            }

            // d1 is greater than d2
            return -1;
          });
      };
      const idleVersions = findIdle();
      if (idleVersions.length && typeof idleVersions[0] !== 'string') {
        return idleVersions[0];
      }
    }
    return null;
  }

  async validate() {
    if (this.id && this.findVersionByStatus('idle') === null) {
      tui.showWarning('Failed to find idle version, refreshing application');
      await this.fetch();
      this.save();
    }
  }

  getVersion(): Version {
    const idleVersion = this.findVersionByStatus('idle');
    if (idleVersion) {
      return idleVersion;
    }

    /* istanbul ignore next */
    return new Version({}, this);
  }

  getPendingVersion() {
    return this.findVersionByStatus('pending');
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

  parse(data: Application21): void {
    super.parse(data);
    const vs = this.version || [];
    this.version = [];
    vs.forEach((v) => {
      if (typeof v !== 'string') {
        this.version.push(new Version(v, this));
      }
    });
  }

  static async create(info: JsonObjType): Promise<Application | undefined> {
    let result = undefined;
    let data: JsonObjType;
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
    if (!data.permission) {
      data.permission = {
        create: ['data', 'stream', 'network'],
      };
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
      Model.handleException(
        'Failed to create the application',
        err as AxiosError
      );
    }
    return result;
  }

  async getAll(): Promise<Application[]> {
    const result: Application[] = [];
    try {
      const response = await HTTP.get(`${this.HOST}?expand=2&verbose=true`);
      response.data.forEach((data: Application21) => {
        const app = new Application(data);
        result.push(app);
      });
    } catch (err) {
      Model.handleException(
        'Failed to load all applications',
        err as AxiosError
      );
    }
    return result;
  }

  async createOauthExternal(oauth: OauthExternal21): Promise<void> {
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
          this.handleException(
            'Failed to update OAuth External',
            err as AxiosError
          );
        }
      } else {
        tui.showError(
          'Failed to update OAuth External, because old OAuth was not loaded correctly'
        );
      }
    }
  }

  async createOauthClient(oauth: OauthClient21): Promise<void> {
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
    } catch (err) {
      if ((err as AxiosError<JsonObjType>)?.response?.data?.code === 500232) {
        try {
          await HTTP.patch(`${this.url}/oauth_client`, oauth);
          tui.showMessage('OAuth Client updated');
        } catch (patchErr) {
          this.handleException(
            'Failed to create OAuth Client',
            patchErr as AxiosError
          );
        }
      } else {
        this.handleException(
          'Failed to create OAuth Client',
          err as AxiosError
        );
      }
    }
  }

  syncFiles(): void {
    const files = this.getVersion().getFiles();
    files.forEach((file: File) => {
      file.syncModified();
    });
  }

  async publish(
    newVersion: string,
    change: string,
    nameIdentifier: string
  ): Promise<boolean> {
    const pending = this.getPendingVersion();
    if (pending) {
      await pending.unpublish();
    }
    const version = this.getVersion();
    version.version_app = newVersion;
    if (version.description) {
      version.description.version = change;
    }
    version.name_identifier = nameIdentifier;
    if (await version.update()) {
      return version.publish();
    }
    return false;
  }

  async updateNameIdentifier(name_identifier: string): Promise<boolean> {
    try {
      const response = await HTTP.patch(`${this.url}`, {
        name_identifier,
      });
      this.parse(response.data);
      return true;
    } catch (err) {
      console.log(err);
      this.handleException(
        `Failed to update ${this.meta.type}: ${this.id}`,
        err as AxiosError
      );
    }
    return false;
  }
}
