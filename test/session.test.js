const test = require('ava');
const util = require('util');
const mockInquirer = require('mock-inquirer');
const readline = require('readline');
const tui = require('../lib/tui');
const files = require('../lib/files');
const Wapp = require('../lib/wapp');
const Config = require('../lib/config');

util.inspect.defaultOptions.depth = 5; // Increase AVA's printing depth
tui.write = () => {};
readline.cursorTo = () => {};
readline.clearLine = () => {};

test.before((t) => {
  files.deleteFile(`${Config.cacheFolder()}/session`);
  files.deleteFile(`${Config.cacheFolder}/application`);
  files.deleteFile(`${Config.cacheFolder}/installation`);
  files.deleteFile('manifest.json');
  files.deleteFolder('foreground');
  files.deleteFolder('background');
  files.deleteFolder('icon');

  t.pass();
});

test('Login Fail', async (t) => {
  const wapp = new Wapp();

  mockInquirer([{
    username: '',
    password: '',
  }, {
    username: 'user',
    password: '',
  }, {
    username: 'user@wappsto.com',
    password: 'wrong',
  }]);

  try {
    await wapp.init();
    t.fail();
  } catch (err) {
    t.deepEqual(err.message, 'Validation failed for field username');
  }

  try {
    await wapp.init();
    t.fail();
  } catch (err) {
    t.deepEqual(err.message, 'Validation failed for field password');
  }

  try {
    await wapp.init();
    t.fail();
  } catch (err) {
    t.deepEqual(err.message, 'LoginError');
  }
});

test('Login', async (t) => {
  const wapp = new Wapp();

  mockInquirer([{
    username: 'user@wappsto.com',
    password: 'password',
  }], {});

  await wapp.init();

  t.deepEqual(files.loadFile(`${Config.cacheFolder()}/session`), 'session');
});

test('Validate session', async (t) => {
  const wapp = new Wapp();

  await wapp.init();

  files.saveFile(`${Config.cacheFolder()}/session`, 'invalid');

  mockInquirer([{
    username: 'user@wappsto.com',
    password: 'password',
  }], {});

  await wapp.init();

  t.deepEqual(files.loadFile(`${Config.cacheFolder()}/session`), 'session');
});
