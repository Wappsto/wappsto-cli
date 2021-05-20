const HTTP = require('./http');
const Config = require('./config');
const tui = require('./tui');

module.exports = class Version {
    constructor(app) {
        this.HOST = Config.host();
        this.id = app.version[0].meta.id;
    }

    async get() {
        let result = {};
        try {
            const response = await HTTP.get(`${this.HOST}/services/version/${this.id}?expand=2&verbose=true`);
            result = response.data;
        } catch (err) {
            /* istanbul ignore next */
            tui.showError(`Failed to get version: ${this.id}`, err);
        }
        return result;
    }

    async update(version) {
        try {
            await HTTP.patch(`${this.HOST}/services/version/${this.id}`, version);
        } catch (err) {
            /* istanbul ignore next */
            tui.showError(`Failed to update version: ${this.id}`, err);
        }
    }

    async delete() {
        try {
            await HTTP.delete(`${this.HOST}/services/version/${this.id}`);
        } catch (err) {
            switch (err.response.data.code) {
            case 9900067:
                // Version already deleted
                break;
            default:
                /* istanbul ignore next */
                tui.showError(`Failed to delete version: ${this.id}`, err);
            }
        }
    }
};
