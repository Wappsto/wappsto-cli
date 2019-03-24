const axios = require('axios');

module.exports = class HTTP {
    static setHeader(name, value) {
        axios.defaults.headers.common[name] = value;
    }

    static removeHeader(name) {
        delete axios.defaults.headers.common[name];
    }

    static async get(url, options = {}) {
        return await axios.get(url, options);
    }

    static async post(url, data) {
        return await axios.post(url, data);
    }

    static async patch(url, data) {
        return await axios.patch(url, data);
    }

    static async delete(url) {
        return await axios.delete(url);
    }
};
