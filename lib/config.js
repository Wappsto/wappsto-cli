const files = require('./files');

let custom = files.loadJsonFile('wappsto.json');

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
        return !!custom.host;
    }

    static port() {
        return custom.port || 3000;
    }

    static cacheFolder() {
        return custom.cacheFolder || '.wappsto-cli-cache';
    }

    static reload() {
        custom = files.loadJsonFile('wappsto.json');
    }
}
module.exports = Config;
