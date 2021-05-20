import test from 'ava';

const avaSettings = require('ava/lib/concordance-options').default;
const mockInquirer = require('mock-inquirer');
const mocking = require('mock-require');
const tui = require('../lib/tui');

mocking('ws', './mock/ws');

const files = require('../lib/files');
const Wapp = require('../lib/wapp');

avaSettings.theme.maxDepth = 2;
tui.write = () => {};

test('failed to delete', async (t) => {
    files.saveJsonFile('.application', {
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

    files.saveJsonFile('.installation', {
        meta: {
            id: 'wrong_installation_id',
        },
    });

    const wapp = new Wapp();

    mockInquirer([{
        del: true,
        local: true,
        remote: true,
    }]);

    await wapp.delete();

    t.pass();
});
