const HTTP = require('./http');
const Config = require('./config');
const tui = require('./tui');
const Version = require('./version');
const files = require('./files');

module.exports = class Application {
    constructor(data) {
        this.HOST = `${Config.host()}/services/application`;
        this.data = data;
        this.version = [];
        if (data && data.meta) {
            this.id = data.meta.id;
        }
        if (data.version) {
            data.version.forEach((v) => {
                this.version.push(new Version(v, this));
            });
        }
    }

    save() {
        const { data } = this;
        for (let i = 0; i < this.version.length; i += 1) {
            data.version[i] = this.version[i].getJSON();
        }
        files.saveJsonFile(`${Config.cacheFolder()}/application`, data);
    }

    getVersion() {
        if (this.version.length > 0) {
            return this.version[0];
        }
        /* istanbul ignore next */
        return new Version();
    }

    async create(info) {
        let result = null;
        let data;
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
                barebone: 'light',
                supported_features: info.features || info.supported_features,
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
            tui.showError('Failed to create Appliation', err);
        }
        return result;
    }

    async get() {
        let result = {};
        try {
            const response = await HTTP.get(`${this.HOST}/${this.id}?expand=2&verbose=true`);
            result = response.data;
        } catch (err) {
            /* istanbul ignore next */
            tui.showError(`Failed to get application: ${this.id}`, err);
        }
        return result;
    }

    async getAll() {
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

    async delete() {
        try {
            await HTTP.delete(`${this.HOST}/${this.id}`);
        } catch (err) {
            /* istanbul ignore next */
            switch (err.response.data.code) {
            case 9900067:
                // Application already deleted
                /* istanbul ignore next */
                break;
            default:
                /* istanbul ignore next */
                tui.showError(`Failed to delete application: ${this.id}`, err);
            }
        }
    }
};
