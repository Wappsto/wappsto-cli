const fs = require('fs');
const FormData = require('form-data');
const HTTP = require('./http');
const Spinner = require('./spinner');
const tui = require('./tui');
const files = require('./files');
const Config = require('./config');
const Session = require('./session');
const utils = require('./util');

class Wappsto {
  constructor() {
    this.HOST = Config.host();
    this.session = new Session();
  }

  async login() {
    const status = new Spinner('Authenticating you, please wait...');
    status.start();

    const validSession = await this.session.validate();
    status.stop();

    if (validSession) {
      return;
    }

    const creds = await tui.askWappstoCredentials(Config.isCustomHost() ? this.HOST : 'Wappsto');

    status.start();

    try {
      await this.session.login(creds.username, creds.password);
      status.stop();
    } catch (err) {
      status.stop();
      throw new Error('LoginError');
    }
  }

  async downloadFile(url, path) {
    files.createFolders(path);

    const response = await HTTP.get(`${this.HOST}/files/${url}`, {
      responseType: 'stream',
    });

    if (response && response.data) {
      /* istanbul ignore if */
      if (response.data.pipe) {
        const writer = fs.createWriteStream(path);
        response.data.pipe(writer);
        return new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });
      }
      files.saveFile(path, response.data);

      return new Promise((resolve) => {
        resolve();
      });
    }
    /* istanbul ignore next */
    return new Promise((resolve, reject) => {
      /* istanbul ignore next */
      reject(new Error('Failed to download file'));
    });
  }

  async createFile(version, file, path, count = 3) {
    let result = false;
    try {
      const response = await HTTP.patch(`${this.HOST}/services/version/${version}`, {
        meta: {
          id: version,
        },
        file: [file],
      });
      try {
        let id = '';
        response.data.file.forEach((newFile) => {
          if (newFile.meta && newFile.meta.id) {
            if (newFile.name === utils.getFileName(path)
                           && newFile.use === utils.getFileUse(path)) {
              id = newFile.meta.id;
            }
          }
        });
        if (id === '') {
          /* istanbul ignore next */
          tui.showError(`Failed to find id in new file: ${path}`);
        } else {
          result = await this.updateFile(version, id, path);
        }
      } catch (err) {
        /* istanbul ignore next */
        tui.showError(`Failed to create File: ${path}`, err);
        /* istanbul ignore next */
        tui.showError(JSON.stringify(response.data.file));
      }
    } catch (err) {
      /* istanbul ignore next */
      if (err && err.response && err.response.data) {
        /* istanbul ignore next */
        switch (err.response.data.code) {
        case 500235:
          // File already created
          break;
        case 9900071:
          if (count) {
            await utils.snooze(500);
            return this.createFile(version, file, path, (count - 1));
          }
          // fall through
        default:
          /* istanbul ignore next */
          tui.showError(`Failed to create File: ${path}`, err);
        }
      } else {
        /* istanbul ignore next */
        tui.showError(`Failed to create File: ${path}`, err);
      }
    }
    return result;
  }

  async updateFile(version, id, fileName) {
    let result = null;
    try {
      const data = new FormData();
      data.append(id, fs.createReadStream(fileName));
      const response = await HTTP.put(
        `${this.HOST}/files/version/${version}?verbose=true`,
        data,
        {
          headers: data.getHeaders(),
        },
      );
      result = response.data;
    } catch (err) {
      /* istanbul ignore next */
      tui.showError(`Failed to update File: ${fileName}`, err);
    }
    return result;
  }

  async deleteFile(id) {
    try {
      await HTTP.delete(`${this.HOST}/services/2.0/file/${id}`);
    } catch (err) {
      /* istanbul ignore next */
      switch (err.response.data.code) {
      case 9900147:
        // File already deleted
        break;
      default:
        /* istanbul ignore next */
        tui.showError(`Failed to delete File: ${id}`, err);
      }
    }
  }

  async updateACL(id, addID, create, method) {
    try {
      const methods = {};
      method.forEach((m) => {
        methods[m] = true;
      });
      await HTTP.patch(`${this.HOST}/services/2.0/acl?propagate=true&id=[${id}]`, {
        permission: [{
          meta: {
            id: addID,
          },
          restriction: [{
            create,
            method: methods,
          }],
        }],
      });
    } catch (err) {
      /* istanbul ignore next */
      switch (err.response.data.code) {
      case 9900071:
        /* istanbul ignore next */
        setTimeout(async () => {
          await this.updateACL(id, addID, create, method);
        }, 100);
        break;
      default:
        /* istanbul ignore next */
        tui.showError('Failed to update ACL', err);
      }
    }
  }

  async updateACLRestriction(id, collection) {
    try {
      const aclResponse = await HTTP.get(`${this.HOST}/services/2.0/acl/${id}/permission/${id}`);
      const aclRestriction = aclResponse.data.installation;

      if (aclRestriction[0].create.includes(collection)) {
        return;
      }
      // Append the new service to the acl restriction for the installation
      aclRestriction[0].create.push(collection);
      await HTTP.patch(`${this.HOST}/services/2.0/acl/${id}/permission/${id}?propagate=true`, { restriction: aclRestriction });
    } catch (err) {
      /* istanbul ignore next */
      tui.showError('Failed to update ACL Restriction', err);
    }
  }

  async find(type, search, method, quantity, notShared) {
    let result = {};
    try {
      const url = `${type}?expand=0&${search}&method=[${method}]&quantity=${quantity}&not_shared_with=${notShared}`;
      const response = await HTTP.get(`${this.HOST}/services/${url}`);
      result = response.data;
    } catch (err) {
      /* istanbul ignore next */
      tui.showError('Failed to find', err);
    }
    return result;
  }

  async readNotification(id, status = 'read') {
    try {
      await HTTP.patch(`${this.HOST}/services/2.0/notification/${id}`, {
        meta: {
          id,
        },
        read: status,
      });
    } catch (err) {
      /* istanbul ignore next */
      if (!err.response || !err.response.data || err.response.data.code !== 9900147) {
        /* istanbul ignore next */
        tui.showError('Failed to read notification', err);
      }
    }
  }
}

module.exports = Wappsto;
