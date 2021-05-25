import test from 'ava';

const avaSettings = require('ava/lib/concordance-options').default;
const files = require('../lib/files');
const Config = require('../lib/config');

avaSettings.theme.maxDepth = 2;

test.before((t) => {
    files.deleteFile('wappsto.json');

    t.pass();
});

test('Default parameters', (t) => {
    t.deepEqual(Config.foreground(), 'foreground');
    t.deepEqual(Config.background(), 'background');
    t.deepEqual(Config.host(), 'https://wappsto.com');
    t.deepEqual(Config.port(), 3000);
    t.deepEqual(Config.cacheFolder(), '.wappsto-cli-cache');
    t.deepEqual(Config.isCustomHost(), false);
});

test('Custom Parameters', (t) => {
    const data = {
        foreground: 'customForeground',
        background: 'customBackground',
        host: 'customHost',
        port: 4000,
        cacheFolder: 'customFolder',
    };
    files.saveJsonFile('wappsto.json', data);

    Config.reload();

    t.deepEqual(Config.foreground(), data.foreground);
    t.deepEqual(Config.background(), data.background);
    t.deepEqual(Config.host(), data.host);
    t.deepEqual(Config.port(), data.port);
    t.deepEqual(Config.cacheFolder(), data.cacheFolder);
    t.deepEqual(Config.isCustomHost(), true);

    files.deleteFile('wappsto.json');
});
