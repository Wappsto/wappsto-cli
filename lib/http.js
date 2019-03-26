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

    static async post(url, data, options = {}) {
        return axios.post(url, data, options);
    }

    static async put(url, data, options = {}) {
        return axios.put(url, data, options);
    }

    static async patch(url, data, options = {}) {
        return axios.patch(url, data, options);
    }

    static async delete(url, options = {}) {
        return axios.delete(url, options);
    }
};
