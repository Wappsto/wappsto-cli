const HTTP = require('./http');
const files = require('./files');
const Config = require('./config');

module.exports = class Session {
    constructor() {
        this.HOST = Config.host();
    }

    get() {
        return this.session;
    }

    static clear() {
        files.deleteFile('.session');
        HTTP.removeHeader('x-session');
    }

    set(session) {
        this.session = session;
        files.saveFile('.session', session);
        HTTP.setHeader('x-session', session);
    }

    setXSession() {
        this.session = files.loadFile('.session');
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
            Session.clear();
        }

        return res;
    }
};
