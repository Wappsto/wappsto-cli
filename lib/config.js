const pkg = require('../package.json');

const custom = pkg['wappsto-cli'] || {};

class Config {
    static foreground() {
        return custom.foreground || 'foreground';
    }

    static background() {
        return custom.background || 'background';
    }

    static host() {
        return custom.host || 'https://wappsto.com';
    }

    static isCustomHost() {
        return custom.host ? true : false;
    }

    static port() {
        return custom.port || 3000;
    }

}
module.exports = Config;
