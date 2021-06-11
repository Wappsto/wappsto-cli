const axios = require('axios');
const tui = require('./tui');

module.exports = class HTTP {
    static setHeader(name, value) {
        axios.defaults.headers.common[name] = value;
    }

    static removeHeader(name) {
        delete axios.defaults.headers.common[name];
    }

    static async get(url, options = {}) {
        tui.showVerbose('HTTP', `GET ${url}`);
        return axios.get(url, options);
    }

    static async post(url, data, options = {}) {
        tui.showVerbose('HTTP', `POST ${url}`);
        return axios.post(url, data, options);
    }

    static async put(url, data, options = {}) {
        tui.showVerbose('HTTP', `PUT ${url}`);
        return axios.put(url, data, options);
    }

    static async patch(url, data, options = {}) {
        tui.showVerbose('HTTP', `PATH ${url}`);
        return axios.patch(url, data, options);
    }

    static async delete(url, options = {}) {
        tui.showVerbose('HTTP', `DELETE ${url}`);
        return axios.delete(url, options);
    }
};
