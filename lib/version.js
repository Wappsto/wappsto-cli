const HTTP = require('./http');
const Config = require('./config');
const tui = require('./tui');
const Util = require('./util');

module.exports = class Version {
    constructor(data, parent) {
        this.HOST = `${Config.host()}/services/2.0/version`;
        this.data = data;
        this.file = [];
        this.application = parent;
        if (data && data.meta) {
            this.id = data.meta.id;
            this.revision = data.meta.revision;
            if (data.file) {
                this.file = data.file;
            }
        }
    }

    getJSON() {
        return this.data;
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

    findFile(filePath) {
        return this.file.find((file) => filePath === `${Util.getFilePath(file.use)}/${file.name}`);
    }

    async update(version) {
        let result = true;
        try {
            const tmp = version;
            delete tmp.barebone;
            delete tmp.barebone_version;
            await HTTP.patch(`${this.HOST}/${this.id}`, tmp);
        } catch (err) {
            tui.showError(`Failed to update version: ${this.id}`, err);
            result = false;
        }
        return result;
    }

    updateFile(filePath, newFile) {
        for (let i = 0; i < this.file.length; i += 1) {
            if (filePath === `${Util.getFilePath(this.file[i].use)}/${this.file[i].name}`) {
                this.file[i] = newFile;
                this.data.file[i] = newFile;
                this.application.save();
                return;
            }
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
                break;
            default:
                tui.showError(`Failed to delete version: ${this.id}`, err);
            }
        }
    }
};
