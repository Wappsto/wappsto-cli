const HTTP = require('./http');
const Config = require('./config');
const tui = require('./tui');
const Version = require('./version');

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
                this.version.push(new Version(v));
            });
        }
    }

    getVersion() {
        if (this.version.length > 0) {
            return this.version[0];
        }
        return new Version();
    }

    async create(info) {
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
            return response.data;
        } catch (err) {
            /* istanbul ignore next */
            tui.showError('Failed to create Appliation', err);
        }
        return null;
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

    async update(version) {
        try {
            await HTTP.patch(`${this.HOST}/${this.id}`, version);
        } catch (err) {
            /* istanbul ignore next */
            tui.showError(`Failed to update version: ${this.id}`, err);
        }
    }

    async delete() {
        try {
            await HTTP.delete(`${this.HOST}/${this.id}`);
        } catch (err) {
            /* istanbul ignore next */
            switch (err.response.data.code) {
            case 9900067:
                // Version already deleted
                /* istanbul ignore next */
                break;
            default:
                /* istanbul ignore next */
                tui.showError(`Failed to delete version: ${this.id}`, err);
            }
        }
    }
};
