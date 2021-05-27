const HTTP = require('./http');
const Config = require('./config');
const tui = require('./tui');

module.exports = class Version {
    constructor(data) {
        this.HOST = `${Config.host()}/services/version`;
        this.data = data;
        this.file = [];
        if (data && data.meta) {
            this.id = data.meta.id;
            this.revision = data.meta.revision;
            if (data.file) {
                this.file = data.file;
            }
        }
    }

    async get() {
        try {
            const response = await HTTP.get(`${this.HOST}/${this.id}?expand=2&verbose=true`);
            return new Version(response.data);
        } catch (err) {
            tui.showError(`Failed to get version: ${this.id}`, err);
        }
        return null;
    }

    async update(version) {
        try {
            await HTTP.patch(`${this.HOST}/${this.id}`, version);
        } catch (err) {
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
