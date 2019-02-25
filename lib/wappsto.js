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
            this.HOST = process.env.WAPPSTO_HOST ? (`https://${process.env.WAPPSTO_HOST}`) : 'https://wappsto.com';
        }
    }

    clearSession() {
        this.conf.delete('session');
        this.conf.delete('host');
        delete axios.defaults.headers.common['x-session'];
    }

    setSession(session) {
        this.conf.set('session', session);
        this.conf.set('host', this.HOST);
        axios.defaults.headers.common['x-session'] = session;
    }

    setXSession() {
        const session = this.conf.get('session');
        if (session) {
            axios.defaults.headers.common['x-session'] = session;
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
                console.log(err);
            }
        }
    }

    async getInstallation(id) {
        try {
            const response = await axios.get(`${this.HOST}/services/installation?this_version_id=${id}&expand=2`);
            if(response.data && response.data.length) {
                return response.data[0];
            }
        } catch (err) {
            console.log(err);
        }
        return {};
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
                console.log(err);
            }
        }
    }

    async deleteApplication(id) {
        try {
            await axios.delete(`${this.HOST}/services/application/${id}`);
        } catch (err) {
            tui.showError(`Failed to delete application: ${id}`);
            console.log(err);
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
                console.log(`Failed to create File: ${err}`);
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
};
