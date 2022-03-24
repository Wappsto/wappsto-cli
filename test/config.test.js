const test = require('ava');
const util = require('util');
const files = require('../lib/files');
const Config = require('../lib/config');

util.inspect.defaultOptions.depth = 5; // Increase AVA's printing depth

test.before((t) => {
  files.deleteFile('wappsto.json');

  Config.reload();

  t.pass();
});

test('Default parameters', (t) => {
  t.deepEqual(Config.foreground(), 'foreground');
  t.deepEqual(Config.background(), 'background');
  t.deepEqual(Config.host(), 'https://wappsto.com');
  t.deepEqual(Config.port(), 3000);
  t.deepEqual(Config.cacheFolder(), '.wappsto-cli-cache/');
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
  t.deepEqual(Config.cacheFolder(), `${data.cacheFolder}/`);
  t.deepEqual(Config.isCustomHost(), true);

  files.deleteFile('wappsto.json');
});

test('Default parameters after reload', (t) => {
  Config.reload();

  t.deepEqual(Config.foreground(), 'foreground');
  t.deepEqual(Config.background(), 'background');
  t.deepEqual(Config.host(), 'https://wappsto.com');
  t.deepEqual(Config.port(), 3000);
  t.deepEqual(Config.cacheFolder(), '.wappsto-cli-cache/');
  t.deepEqual(Config.isCustomHost(), false);
});
