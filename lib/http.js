const axios = require('axios');

module.exports = class HTTP {
    static setHeader(name, value) {
        axios.defaults.headers.common[name] = value;
    }

    static removeHeader(name) {
        delete axios.defaults.headers.common[name];
    }

    static async get(url, options = {}) {
        return axios.get(url, options);
    }

    static async post(url, data) {
        return axios.post(url, data);
    }

    static async put(url, data, options = {}) {
        return axios.put(url, data, options);
    }

    static async patch(url, data) {
        return axios.patch(url, data);
    }

    static async delete(url) {
        return axios.delete(url);
    }
};
