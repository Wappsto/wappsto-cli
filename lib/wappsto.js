const WebSocket = require('ws');
const axios = require('axios');
const Configstore = require('configstore');
const fs = require('fs');
const CLI = require('clui');
const FormData = require('form-data');
const pkg = require('../package.json');
const tui = require('./tui');
const files = require('./files');

const { Spinner } = CLI;


module.exports = class Wappsto {
    constructor() {
        this.applications = [];
        this.conf = new Configstore(pkg.name);
        this.HOST = this.conf.get('host');
        if (!this.HOST) {
            const eHost = `https://${process.env.WAPPSTO_HOST}`;
            this.HOST = process.env.WAPPSTO_HOST ? eHost : 'https://wappsto.com';
        }
    }

    clearSession() {
        this.conf.delete('session');
        this.conf.delete('host');
        delete axios.defaults.headers.common['x-session'];
    }

    setSession(session) {
        this.session = session;
        this.conf.set('session', session);
        this.conf.set('host', this.HOST);
        axios.defaults.headers.common['x-session'] = session;
    }

    setXSession() {
        this.session = this.conf.get('session');
        if (this.session) {
            axios.defaults.headers.common['x-session'] = this.session;
            return true;
        }
        return false;
    }

    async validateSession() {
        if (!this.setXSession()) {
            return false;
        }

        const status = new Spinner('Validating session, please wait...');
        status.start();

        let res = false;
        try {
            await axios.get(`${this.HOST}/services/session`);
            res = true;
        } catch (err) {
            this.clearSession();
        }

        status.stop();
        return res;
    }

    async getSession(id) {
        try {
            const response = await axios.get(`${this.HOST}/services/session/${id}`, {
                headers: {
                    'x-session': id,
                },
            });
            return response.data;
        } catch (err) {
            console.error('Failed to load session', err);
            return {};
        }
    }

    async getUser(session) {
        try {
            const response = await axios.get(`${this.HOST}/services/user`, {
                headers: {
                    'x-session': session,
                },
            });
            return response.data;
        } catch (err) {
            console.error('Failed to load user', err);
            return {};
        }
    }

    async login() {
        const validSession = await this.validateSession();

        if (validSession) {
            return;
        }

        const creds = await tui.askWappstoCredentials();

        const status = new Spinner('Authenticating you, please wait...');
        status.start();

        try {
            const response = await axios.post(`${this.HOST}/services/session`, {
                username: creds.username,
                password: creds.password,
                remember_me: true,
            });

            status.stop();
            this.setSession(response.data.meta.id);
        } catch (err) {
            status.stop();
            throw new Error('LoginError');
        }
    }

    async loadApplications() {
        try {
            const response = await axios.get(`${this.HOST}/services/application?expand=2&verbose=true`);
            this.applications = response.data;
        } catch (err) {
            throw new Error('Failed to load applications');
        }
    }

    async loadApplication(id) {
        try {
            const response = await axios.get(`${this.HOST}/services/application/${id}?expand=2&verbose=true`);
            return response.data;
        } catch (err) {
            return null;
        }
    }

    async downloadFile(url, path) {
        files.createFolders(path);
        const writer = fs.createWriteStream(path);

        const response = await axios({
            url: `${this.HOST}/files/${url}`,
            method: 'GET',
            responseType: 'stream',
        });

        if (response && response.data) {
            response.data.pipe(writer);
            return new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });
        }
        return new Promise((resolve, reject) => {
            reject(new Error('Failed to download file'));
        });
    }

    getApplications() {
        return this.applications;
    }

    async createApplication(name, features) {
        try {
            const response = await axios.post(`${this.HOST}/services/application`, {
                version: [{
                    name,
                    title: '',
                    author: '',
                    status: 'idle',
                    description: {
                        general: '',
                        version: '',
                        foreground: '',
                        background: '',
                        widget: '',
                    },
                    file: [],
                    barebone: 'light',
                    supported_features: features,
                }],
            });
            return response.data;
        } catch (err) {
            tui.showError('Failed to create Appliation');
            console.error(err);
        }
        return null;
    }

    async updateVersion(version) {
        try {
            await axios.patch(`${this.HOST}/services/version/${version.meta.id}`, version);
        } catch (err) {
            if (err && err.response && err.response.data) {
                tui.showError(`Failed to update Version: ${err.response.data.message}`);
                console.error(err.response.data.data);
            } else {
                console.error('Failed to get error data');
            }
        }
    }

    async deleteVersion(id) {
        try {
            await axios.delete(`${this.HOST}/services/version/${id}`);
        } catch (err) {
            switch (err.response.data.code) {
            case 9900067:
                // Version already deleted
                break;
            default:
                tui.showError(`Failed to delete version: ${id}`);
                console.error(err);
            }
        }
    }

    async createInstallation(id) {
        try {
            await axios.post(`${this.HOST}/services/installation`, {
                application: id,
            });
        } catch (err) {
            console.error(err);
        }
    }

    async getInstallation(id, name) {
        try {
            let url = `${this.HOST}/services/installation?expand=2`;
            if (id) {
                url += `&this_version_id=${id}`;
            }
            if (name) {
                url += `&this_name=${name}`;
            }
            const response = await axios.get(url);
            if (response.data && response.data.length) {
                return response.data[0];
            }
        } catch (err) {
            console.error(err);
        }
        return {};
    }

    async restartInstallation(id, file = true, user = false, extsync = false) {
        try {
            await axios.patch(`${this.HOST}/services/installation/${id}`, {
                extsync,
                restart: {
                    new_file: file,
                    new_user: user,
                },
            });
        } catch (err) {
            console.error('Failed to restart installation', err);
        }
    }

    async deleteInstallation(id) {
        try {
            await axios.delete(`${this.HOST}/services/installation?this_version_id=${id}`);
        } catch (err) {
            switch (err.response.data.code) {
            case 300020:
                // Installation already deleted
                break;
            default:
                tui.showError(`Failed to delete installation: ${id}`);
                console.error(err);
            }
        }
    }

    async deleteApplication(id) {
        try {
            await axios.delete(`${this.HOST}/services/application/${id}`);
        } catch (err) {
            tui.showError(`Failed to delete application: ${id}`);
            console.error(err);
        }
    }

    async createFile(version, file, data) {
        try {
            const response = await axios.patch(`${this.HOST}/services/version/${version}`, {
                meta: {
                    id: version,
                },
                file: [file],
            });
            const { id } = response.data.file.slice(-1)[0].meta;
            await this.updateFile(version, id, data);
        } catch (err) {
            if (err && err.response && err.response.data) {
                switch (err.response.data.code) {
                case 500235:
                    // File already created
                    break;
                default:
                    tui.showError(`Failed to create File: ${err.response.data.message}`);
                    console.error(err.response.data.data);
                    console.error(err);
                }
            } else {
                console.error(`Failed to create File: ${err}`);
            }
        }
    }

    async updateFile(version, id, file) {
        try {
            const data = new FormData();
            data.append(id, file);
            await axios.put(`${this.HOST}/files/version/${version}`, data, {
                headers: {
                    'Content-Type': data.getHeaders()['content-type'],
                },
            });
        } catch (err) {
            tui.showError('Failed to update File');
            console.error(err.response.data);
        }
    }

    async deleteFile(id) {
        try {
            await axios.delete(`${this.HOST}/services/file/${id}`);
        } catch (err) {
            switch (err.response.data.code) {
            case 9900147:
                // File already deleted
                break;
            default:
                tui.showError('Failed to delete File');
                console.error(err);
            }
        }
    }

    async getStreams(session) {
        try {
            const response = await axios.get(`${this.HOST}/services/stream?expand=2`, {
                headers: {
                    'x-session': session || this.session,
                },
            });
            return response.data;
        } catch (err) {
            tui.showError('Failed to get Streams');
            return [];
        }
    }

    async createStream(subscription, session) {
        try {
            const response = await axios.post(`${this.HOST}/services/stream`, {
                subscription,
            }, {
                headers: {
                    'x-session': session || this.session,
                },
            });
            return response.data;
        } catch (err) {
            console.error('Failed to create stream', err);
            return {};
        }
    }

    parseStreamEvent(message, callback) {
        try {
            const data = JSON.parse(message);
            data.forEach((event) => {
                if (this.last_stream_event === event.meta.id) {
                    return;
                }
                this.last_stream_event = event.meta.id;

                const ev = event[event.meta_object.type];
                if (!ev.meta || !ev.meta.type) {
                    console.error('Unknown event', ev);
                    return;
                }
                switch (ev.meta.type) {
                case 'state':
                    break;
                case 'installation':
                    callback({ status: 'Installation Updated' });
                    break;
                case 'extsync':
                    try {
                        const body = JSON.parse(ev.body);
                        let msg = '';
                        Object.keys(body.arguments).forEach((key) => {
                            msg += `${body.arguments[key]} `;
                        });
                        const timestamp = new Date(body.time).toLocaleTimeString();
                        switch (body.key) {
                        case 'log':
                            callback({ log: `${timestamp}: Background - ${msg}` });
                            break;
                        case 'error':
                            callback({ error: `${timestamp}: Background - ${msg}` });
                            break;
                        default:
                            callback({ log: `${timestamp}: Unknown Background Message '${body.key}' - ${msg}` });
                        }
                    } catch (err) {
                        console.error(err);
                        callback(ev.body);
                    }
                    break;
                case 'notification':
                    switch (ev.base.code) {
                    case 1100028:
                        if (ev.custom.code === 1299999) {
                            callback({ reinstall: true, log: ev.custom.message });
                        } else {
                            callback({ status: ev.custom.message });
                        }
                        break;
                    case 1100002:
                        if (this.last_permission_request !== ev.timestamp) {
                            this.last_permission_request = ev.timestamp;
                            callback({ req: ev.custom, installation: ev.base.from });
                        }
                        break;
                    case 1100006:
                    case 1100004:
                        break;
                    default:
                        callback(ev);
                    }
                    break;
                default:
                    callback(ev);
                }
            });
        } catch (err) {
            console.error('Failed to handle stream event', err);
        }
    }

    openStream(env, id, callback, session) {
        const host = env + this.HOST.split('//')[1];
        const ses = session || this.session;
        const wss = `wss://${host}/services/stream/${id}?x-session=${ses}`;

        const ws = new WebSocket(wss, {
            origin: `https://${host}`,
        });

        ws.on('close', () => {
            // console.error(`Stream closed: ${id}`);
        });

        ws.on('error', (err) => {
            console.error(`Stream error: ${id}`, err);
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
            await axios.patch(`${this.HOST}/services/acl?propagate=true&id=[${id}]`, {
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
            console.error(err);
        }
    }
};
