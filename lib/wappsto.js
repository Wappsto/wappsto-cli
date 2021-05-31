const WebSocket = require('ws');
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
            await HTTP.delete(`${this.HOST}/services/file/${id}`);
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

    async getStreams(session) {
        try {
            const response = await HTTP.get(`${this.HOST}/services/stream?expand=2`, {
                headers: {
                    'x-session': session || this.session.get(),
                },
            });
            return response.data;
        } catch (err) {
            /* istanbul ignore next */
            tui.showError('Failed to get streams');
            return [];
        }
    }

    async createStream(subscription, session) {
        try {
            const response = await HTTP.post(`${this.HOST}/services/stream`, {
                subscription,
            }, {
                headers: {
                    'x-session': session || this.session.get(),
                },
            });
            return response.data;
        } catch (err) {
            /* istanbul ignore next */
            tui.showError(`Failed to create stream for ${subscription}`, err);
            return {};
        }
    }

    parseStreamEvent(message, callback) {
        try {
            const data = JSON.parse(message);
            data.forEach(async (event) => {
                if (this.last_stream_event === event.meta.id) {
                    return;
                }
                this.last_stream_event = event.meta.id;

                if (event.event === 'delete') {
                    return;
                }

                const ev = event[event.meta_object.type];
                if (!ev || !ev.meta || !ev.meta.type) {
                    tui.showError('Unknown event', event);
                    return;
                }
                switch (ev.meta.type) {
                case 'state':
                    break;
                case 'installation':
                    callback({ application: ev.application, status: 'Installation Updated', session: true });
                    break;
                case 'extsync':
                    try {
                        if (ev.uri !== 'extsync/wappsto/editor/console') {
                            callback({
                                log: ev.body,
                                type: 'ExtSync IN',
                                timestamp: new Date().toLocaleTimeString(),
                            });
                        } else {
                            const body = JSON.parse(ev.body);
                            let msg = '';
                            const timestamp = new Date(body.time).toLocaleTimeString();

                            Object.keys(body.arguments).forEach((key) => {
                                if (typeof (body.arguments[key]) === 'string') {
                                    msg += `${body.arguments[key]} `;
                                } else {
                                    msg += JSON.stringify(body.arguments[key]);
                                }
                            });

                            const eventMsg = {
                                type: 'Background',
                                timestamp,
                            };
                            switch (body.key) {
                            case 'log':
                                eventMsg.log = msg;
                                break;
                            case 'error':
                                eventMsg.error = msg;
                                break;
                            default:
                                eventMsg.log = `Unknown Background Message '${body.key}' - ${msg}`;
                            }
                            callback(eventMsg);
                        }
                    } catch (err) {
                        tui.showError(err);
                        callback(ev.body);
                    }
                    break;
                case 'notification':
                    if (ev.read === 'unread') {
                        let readNotification = true;
                        switch (ev.base.code) {
                        case 1100028:
                            if (ev.custom.code === 1299999) {
                                callback({ reinstall: true, log: ev.custom.message });
                            } else {
                                callback({ status: ev.custom.message });
                            }
                            break;
                        case 1100002:
                        case 1100003:
                            if (this.last_permission_request !== ev.timestamp) {
                                this.last_permission_request = ev.timestamp;
                                readNotification = false;
                                // eslint-disable-next-line max-len
                                callback({ req: ev.custom, installation: ev.base.from, id: ev.meta.id });
                            }
                            break;
                        case 1100006:
                        case 1100004:
                            break;
                        default:
                            callback(ev);
                        }
                        if (readNotification) {
                            await this.readNotification(ev.meta.id);
                        }
                    }
                    break;
                default:
                    callback(ev);
                }
            });
        } catch (err) {
            /* istanbul ignore next */
            tui.showError('Failed to handle stream event', err);
        }
    }

    openStream(env, id, callback, session) {
        const host = env + this.HOST.split('//')[1];
        const ses = session || this.session.get();
        const wss = `wss://${host}/services/stream/${id}?x-session=${ses}`;

        const ws = new WebSocket(wss, {
            origin: `https://${host}`,
        });

        ws.on('close', () => {
            // console.error(`Stream closed: ${id}`);
        });

        ws.on('error', (err) => {
            tui.showError(`Stream error: ${id}`, err);
        });

        ws.on('message', (message) => {
            this.parseStreamEvent(message, callback);
        });

        return ws;
    }

    async updateACL(id, addID, create, method) {
        try {
            const methods = {};
            method.forEach((m) => {
                methods[m] = true;
            });
            await HTTP.patch(`${this.HOST}/services/acl?propagate=true&id=[${id}]`, {
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
            await HTTP.patch(`${this.HOST}/services/acl/${id}/permission/${id}?propagate=true`, data);
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
            await HTTP.patch(`${this.HOST}/services/notification/${id}`, {
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
