const test = require('ava');
const util = require('util');
const mockInquirer = require('mock-inquirer');
const mocking = require('mock-require');
const readline = require('readline');

mocking('ws', './mock/ws');

const tui = require('../lib/tui');
const Config = require('../lib/config');
const files = require('../lib/files');
const Wapp = require('../lib/wapp');

util.inspect.defaultOptions.depth = 5; // Increase AVA's printing depth
tui.write = () => {};
// eslint-disable-next-line no-console
console.error = () => {};
readline.cursorTo = () => {};
readline.clearLine = () => {};

test.before((t) => {
  files.createFolders(`${Config.cacheFolder()}/application`);
  files.saveJsonFile(`${Config.cacheFolder()}/application`, {
    version: [
      {
        meta: {
          id: 'wrong_version_id',
        },
      },
    ],
    meta: {
      id: 'application_id',
    },
  });

  files.saveJsonFile(`${Config.cacheFolder()}/installation`, {
    meta: {
      id: 'wrong_installation_id',
    },
  });

  t.pass();
});

test('failed to update', async (t) => {
  const wapp = new Wapp();

  const updatedFiles = await wapp.update();

  t.deepEqual(updatedFiles, []);
});

test('failed to delete', async (t) => {
  const wapp = new Wapp();

  mockInquirer([{
    del: true,
    local: true,
    remote: true,
  }]);

  await wapp.delete();

  t.pass();
});
