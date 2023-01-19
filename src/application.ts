import HTTP from './http';
import Config from './config';
import tui from './tui';
import Version from './version';
import { saveJsonFile } from './files';

export default class Application {
  HOST: string;
  data: any;
  version: any[];
  id: string = '';

  constructor(data: any) {
    this.HOST = `${Config.host()}/services/2.1/application`;
    this.data = data;
    this.version = [];
    if (data && data.meta) {
      this.id = data.meta.id;
    }
    if (data.version) {
      data.version.forEach((v: any) => {
        this.version.push(new Version(v, this));
      });
    }
  }

  save(): void {
    const { data } = this;
    for (let i = 0; i < this.version.length; i += 1) {
      data.version[i] = this.version[i].getJSON();
    }
    saveJsonFile(`${Config.cacheFolder()}application`, data);
  }

  getVersion(): any {
    if (this.version.length > 0) {
      return this.version[0];
    }
    /* istanbul ignore next */
    return new Version();
  }

  async create(info: any): Promise<any> {
    let result = null;
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
      const response = await HTTP.post(`${this.HOST}?verbose=true`, {
        version: [data],
      });
      result = new Application(response.data);
    } catch (err) {
      /* istanbul ignore next */
      tui.showError('Failed to create the application', err);
    }
    return result;
  }

  async get(): Promise<any> {
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

  async getAll(): Promise<any> {
    let result = {};
    try {
      const response = await HTTP.get(`${this.HOST}?expand=2&verbose=true`);
      result = response.data;
    } catch (err) {
      /* istanbul ignore next */
      tui.showError('Failed to load all applications');
    }
    return result;
  }

  async delete(): Promise<void> {
    try {
      await HTTP.delete(`${this.HOST}/${this.id}`);
    } catch (err: any) {
      /* istanbul ignore next */
      switch (err.response.data.code) {
        case 9900067:
          // Application already deleted
          /* istanbul ignore next */
          break;
        case 300024:
          throw Error('Can not delete application that is published!');
        default:
          /* istanbul ignore next */
          tui.showError(`Failed to delete application: ${this.id}`, err);
      }
    }
  }

  async oauth_external(oauth: any, externals: any[] = []): Promise<void> {
    if (externals.length === 0) {
      try {
        await HTTP.post(`${this.HOST}/${this.id}/oauth_external`, oauth);
        tui.showMessage('External OAuth created');
      } catch (err) {
        tui.showError('Failed to create OAuth External', err);
      }
    } else {
      try {
        await HTTP.patch(
          `${this.HOST}/${this.id}/oauth_external/${externals[0].meta.id}`,
          oauth
        );
        tui.showMessage('External OAuth updated');
      } catch (err) {
        tui.showError('Failed to update OAuth External', err);
      }
    }
  }

  async oauth_client(oauth: any): Promise<void> {
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
}
