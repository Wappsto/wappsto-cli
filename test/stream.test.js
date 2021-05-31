const test = require('ava');
const util = require('util');
const mockInquirer = require('mock-inquirer');
const mocking = require('mock-require');

mocking('ws', './mock/ws');

const tui = require('../lib/tui');
const Config = require('../lib/config');
const files = require('../lib/files');
const Wapp = require('../lib/wapp');

util.inspect.defaultOptions.depth = 5; // Increase AVA's printing depth
tui.write = () => {};
tui.showError = () => {};

test.before((t) => {
    files.createFolders(`${Config.cacheFolder()}/application`);
    files.saveJsonFile(`${Config.cacheFolder()}/application`, {
        version: [
            {
                meta: {
                    id: 'version_id',
                },
            },
        ],
        meta: {
            id: 'application_id',
        },
    });

    files.saveJsonFile(`${Config.cacheFolder()}/installation`, {
        meta: {
            id: 'installation_id',
        },
    });

    t.pass();
});

test('stream log', async (t) => {
    const wapp = new Wapp();
    await wapp.openStream(() => {});
    wapp.handleStreamEvent({
        application: 'wrong',
    });
    wapp.handleStreamEvent({
        installation: 'wrong',
    });
    wapp.handleStreamEvent({
        log: 'log test',
    });
    wapp.handleStreamEvent({
        error: 'error test',
    });
    wapp.handleStreamEvent({
        status: 'status test',
        session: 'session',
    });
    wapp.handleStreamEvent({
    });
    wapp.handleStreamEvent('string test');

    t.pass();
});

test('stream reinstall', async (t) => {
    const wapp = new Wapp();
    await wapp.openStream();
    wapp.handleStreamEvent({
        reinstall: true,
        log: 'reinstall log',
    });

    t.pass();
});

test('stream empty req', async (t) => {
    const wapp = new Wapp();
    await wapp.openStream();
    wapp.handleStreamEvent({
        req: {},
    });
    t.pass();
});

test('stream req limitation', async (t) => {
    const wapp = new Wapp();

    mockInquirer([{
        permission: ['network_id'],
    }]);

    await wapp.openStream();
    wapp.handleStreamEvent({
        id: 'notification_id',
        req: {
            type: 'network',
            method: ['POST'],
            quantity: 2,
            limitation: {
                name: {
                    name: ['test'],
                },
            },
        },
    });

    wapp.handleStreamEvent({
        id: 'notification_id',
        req: {
            type: 'network',
            method: ['POST'],
            quantity: 2,
            limitation: {
                name: {
                    name: ['wrong'],
                },
            },
        },
    });

    t.pass();
});

test('stream req collection', async (t) => {
    const wapp = new Wapp();
    await wapp.openStream();

    mockInquirer([{}, {
        accept: true,
    }, {
        accept: true,
    }]);

    wapp.handleStreamEvent({
        id: 'notification_id',
        req: {
            type: 'test',
            method: ['POST'],
            quantity: 2,
            collection: {

            },
        },
    });

    wapp.handleStreamEvent({
        id: 'notification_id',
        req: {
            type: 'test',
            method: ['add'],
            quantity: 2,
            collection: {

            },
        },
    });

    wapp.handleStreamEvent({
        id: 'notification_id',
        req: {
            type: 'test',
            method: ['wrong'],
            quantity: 2,
            collection: {

            },
        },
    });

    t.pass();
});
