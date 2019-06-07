const HTTP = require('./http');
const files = require('./files');
const Config = require('./config');

module.exports = class Session {
    constructor() {
        this.HOST = Config.host();
        this.cacheFolder = Config.cacheFolder();
    }

    get() {
        return this.session;
    }

    clear() {
        files.deleteFile(`${this.cacheFolder}/session`);
        HTTP.removeHeader('x-session');
    }

    set(session) {
        this.session = session;
        files.saveFile(`${this.cacheFolder}/session`, session);
        HTTP.setHeader('x-session', session);
    }

    setXSession() {
        this.session = files.loadFile(`${this.cacheFolder}/session`);
        if (this.session) {
            HTTP.setHeader('x-session', this.session);
            return true;
        }
        return false;
    }

    async validate() {
        if (!this.setXSession()) {
            return false;
        }

        let res = false;
        try {
            await HTTP.get(`${this.HOST}/services/session`);
            res = true;
        } catch (err) {
            this.clear();
        }

        return res;
    }
};
