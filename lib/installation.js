const HTTP = require('./http');
const files = require('./files');
const Config = require('./config');
const tui = require('./tui');

module.exports = class Installation {
  constructor() {
    this.HOST = `${Config.host()}/services/2.0/installation`;
    this.HOST_21 = `${Config.host()}/services/2.1/installation`;
    this.cacheFolder = Config.cacheFolder();
    this.json = files.loadJsonFile(`${this.cacheFolder}/installation`);
  }

  save() {
    files.saveJsonFile(`${this.cacheFolder}/installation`, this.json);
  }

  get data() {
    return this.json;
  }

  get session() {
    return this.json.session;
  }

  get id() {
    return this.json.meta.id;
  }

  get token() {
    return this.json.token_installation;
  }

  get hasForeground() {
    return this.json.supported_features.indexOf('foreground') !== -1;
  }

  get hasBackground() {
    return this.json.supported_features.indexOf('background') !== -1;
  }

  async create(id) {
    try {
      const response = await HTTP.post(`${this.HOST}`, {
        application: id,
      });
      this.json = response.data;
      this.save();
    } catch (err) {
      /* istanbul ignore next */
      tui.showError('Failed to create installation', err);
    }
  }

  async load(id) {
    try {
      let url = `${this.HOST}?expand=2`;
      if (id) {
        url += `&this_version_id=${id}`;
      }
      const response = await HTTP.get(url);
      if (response.data && response.data.length) {
        [this.json] = response.data;
        this.save();
      } else {
        await this.create(id);
      }
    } catch (err) {
      /* istanbul ignore next */
      tui.showError(`Failed to load installation: ${id}`, err);
    }
  }

  async restart() {
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

  async reinstall() {
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

  async stop() {
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

  async setExtSync(enableExtSync) {
    try {
      await HTTP.patch(`${this.HOST}/${this.id}`, {
        extsync: enableExtSync,
      });
    } catch (err) {
      /* istanbul ignore next */
      tui.showError(`Failed to change ExtSync for installation: ${this.id}`, err);
    }
  }

  async delete(id) {
    try {
      await HTTP.delete(`${this.HOST}?this_version_id=${id}`);
    } catch (err) {
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
};
