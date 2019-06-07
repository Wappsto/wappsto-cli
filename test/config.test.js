import test from 'ava';

const avaSettings = require('ava/lib/concordance-options');
const files = require('../lib/files');
const Config = require('../lib/config');

avaSettings.diff.maxDepth = 2;

test.before((t) => {
    files.deleteFile('wappsto.json');

    t.pass();
});

test('Default parameters', (t) => {
    t.is(Config.foreground(), 'foreground');
    t.is(Config.background(), 'background');
    t.is(Config.host(), 'https://wappsto.com');
    t.is(Config.port(), 3000);
    t.is(Config.cacheFolder(), '.wappsto-cli-cache');
    t.is(Config.isCustomHost(), false);
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

    t.is(Config.foreground(), data.foreground);
    t.is(Config.background(), data.background);
    t.is(Config.host(), data.host);
    t.is(Config.port(), data.port);
    t.is(Config.cacheFolder(), data.cacheFolder);
    t.is(Config.isCustomHost(), true);

    files.deleteFile('wappsto.json');
});
