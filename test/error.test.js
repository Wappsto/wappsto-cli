import test from 'ava';

const avaSettings = require('ava/lib/concordance-options').default;
const mockInquirer = require('mock-inquirer');
const mocking = require('mock-require');
const tui = require('../lib/tui');
const Config = require('../lib/config');

mocking('ws', './mock/ws');

const files = require('../lib/files');
const Wapp = require('../lib/wapp');

avaSettings.theme.maxDepth = 2;
tui.write = () => {};

test.before((t) => {
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
/*
test('failed to update', async (t) => {
    const wapp = new Wapp();

    await wapp.update();

    t.pass();
});
*/

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
