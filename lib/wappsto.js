const fs = require('fs');
const FormData = require('form-data');
const HTTP = require('./http');
const Spinner = require('./spinner');
const tui = require('./tui');
const files = require('./files');
const Config = require('./config');
const Session = require('./session');

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
        return new Promise((resolve, reject) => {
            reject(new Error('Failed to download file'));
        });
    }

    async createFile(version, file, path, count = 3) {
        try {
            const response = await HTTP.patch(`${this.HOST}/services/version/${version}`, {
                meta: {
                    id: version,
                },
                file: [file],
            });
            try {
                let id = '';
                const newFile = response.data.file.slice(-1)[0];
                if (newFile.meta && newFile.meta.id) {
                    id = newFile.meta.id;
                } else if (typeof (newFile) === 'string') {
                    id = newFile;
                } else {
                    tui.showError(`Failed to find id in new file: ${path}`);
                    return false;
                }
                await this.updateFile(version, id, path);
                return true;
            } catch (err) {
                /* istanbul ignore next */
                tui.showError(`Failed to create File: ${path}`, err);
                /* istanbul ignore next */
                tui.showError(JSON.stringify(response.data.file));
            }
        } catch (err) {
            if (err && err.response && err.response.data) {
                switch (err.response.data.code) {
                case 500235:
                    // File already created
                    break;
                case 9900071:
                    if (count) {
                        setTimeout(async () => {
                            this.createFile(version, file, path, (count - 1));
                        }, 500);
                        break;
                    }
                    // eslint-disable-next-line no-fallthrough
                default:
                    /* istanbul ignore next */
                    tui.showError(`Failed to create File: ${path}`, err);
                }
            } else {
                /* istanbul ignore next */
                tui.showError(`Failed to create File: ${path}`, err);
            }
        }
        return false;
    }

    async updateFile(version, id, fileName) {
        let result = null;
        try {
            const data = new FormData();
            data.append(id, fs.createReadStream(fileName));
            const response = await HTTP.put(`${this.HOST}/files/version/${version}?verbose=true`, data, {
                headers: data.getHeaders(),
            });
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
            switch (err.response.data.code) {
            case 9900071:
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

    async updateACLRestriction(id, type, collection, methods) {
        try {
            const data = {
                restriction: [
                    {
                        method: methods,
                    },
                ],
            };
            data.restriction[0][type] = [collection];
            await HTTP.patch(`${this.HOST}/services/2.0/acl/${id}/permission/${id}?propagate=true`, data);
        } catch (err) {
            /* istanbul ignore next */
            tui.showError('Failed to update ACL Restriction', err);
        }
    }

    async find(type, search, method, quantity, notShared) {
        try {
            const url = `${type}?expand=0&${search}&method=[${method}]&quantity=${quantity}&not_shared_with=${notShared}`;
            const response = await HTTP.get(`${this.HOST}/services/${url}`);
            return response.data;
        } catch (err) {
            /* istanbul ignore next */
            tui.showError('Failed to find', err);
        }
        return {};
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
            if (!err.response || !err.response.data || err.response.data.code !== 9900147) {
                /* istanbul ignore next */
                tui.showError('Failed to read notification', err);
            }
        }
    }
}

module.exports = Wappsto;
