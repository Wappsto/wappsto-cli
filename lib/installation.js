const HTTP = require('./http');
const files = require('./files');
const Config = require('./config');
const tui = require('./tui');

module.exports = class Installation {
    constructor() {
        this.HOST = Config.host();
        this.json = files.loadJsonFile('.installation');
    }

    async create(id) {
        try {
            const response = await HTTP.post(`${this.HOST}/services/installation`, {
                application: id,
            });
            this.json = response.data;
            this.save();
        } catch (err) {
            /* istanbul ignore next */
            console.error(err);
        }
    }

    save() {
        files.saveJsonFile('.installation', this.json);
    }

    get data() {
        return this.json;
    }

    get session() {
        return this.json.session;
    }

    get meta() {
        return this.json.meta;
    }

    async load(id) {
        try {
            let url = `${this.HOST}/services/installation?expand=2`;
            if (id) {
                url += `&this_version_id=${id}`;
            }
            const response = await HTTP.get(url);
            if (response.data && response.data.length) {
                [this.json] = response.data;
                this.save();
            } else {
                this.create(id);
            }
        } catch (err) {
            /* istanbul ignore next */
            console.error(err);
        }
    }

    async restart(file = true, user = false, extsync = false) {
        try {
            await HTTP.patch(`${this.HOST}/services/installation/${this.json.meta.id}`, {
                extsync,
                restart: {
                    new_file: file,
                    new_user: user,
                },
            });
        } catch (err) {
            /* istanbul ignore next */
            console.error('Failed to restart installation', err);
        }
    }

    async delete(id) {
        try {
            await HTTP.delete(`${this.HOST}/services/installation?this_version_id=${id}`);
        } catch (err) {
            switch (err.response.data.code) {
            case 300020:
                // Installation already deleted
                break;
                /* istanbul ignore next */
            default:
                tui.showError(`Failed to delete installation: ${id}`);
                console.error(err);
            }
        }
    }
};