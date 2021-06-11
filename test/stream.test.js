const test = require('ava');
const util = require('util');
const mockInquirer = require('mock-inquirer');
const mocking = require('mock-require');
const sinon = require('sinon');

mocking('ws', './mock/ws');

const tui = require('../lib/tui');
const Config = require('../lib/config');
const files = require('../lib/files');
const Wapp = require('../lib/wapp');

util.inspect.defaultOptions.depth = 5; // Increase AVA's printing depth
const writeStub = sinon.stub(tui, 'write');

function sendMessage(w, msg) {
    const tmp = msg;

    tmp.meta = {
        id: Math.random().toString(36).substring(7),
    };

    w.appStream.message(JSON.stringify(tmp));
}

function sendData(w, type, data, parameters = {}) {
    const tmp = data;
    if (typeof tmp !== 'string') {
        tmp.meta = {
            id: `${type}_id`,
        };
    }
    const msg = {
        data: tmp,
        event: 'update',
        meta_object: {
            type,
        },
    };

    Object.keys(parameters).forEach((key) => {
        msg[key] = parameters[key];
    });

    sendMessage(w, msg);
}

function sendBody(w, type, data, body) {
    const tmp = data;
    tmp.body = JSON.stringify(body);

    sendData(w, type, tmp);
}

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

test('stream error', async (t) => {
    const wapp = new Wapp();
    await wapp.openStream(() => {});

    writeStub.reset();
    wapp.appStream.error('test error');
    t.assert(writeStub.callCount === 2);
    t.assert(writeStub.getCall(0).args[0].includes('Stream error: stream_id'));

    writeStub.reset();
    wapp.appStream.message('{}');
    t.assert(writeStub.callCount === 0);

    writeStub.reset();
    wapp.appStream.close(9999, 'test error');
    t.assert(writeStub.callCount === 1);
    t.assert(writeStub.getCall(0).args[0].includes('test error (9999)'));

    writeStub.reset();
    wapp.appStream.close(1000, 'test error');
    t.assert(writeStub.callCount === 0);
});

test('stream invalid data', async (t) => {
    const wapp = new Wapp();
    await wapp.openStream(() => {});

    writeStub.reset();
    wapp.appStream.message('{"meta":{"id":"id"},"event":"delete"}');
    t.assert(writeStub.callCount === 0);

    writeStub.reset();
    wapp.appStream.message('{"meta":{"id":"id"}}');
    t.assert(writeStub.callCount === 0);

    writeStub.reset();
    wapp.appStream.message('{}');
    t.assert(writeStub.callCount === 0);

    writeStub.reset();
    wapp.appStream.message('asd');
    t.assert(writeStub.callCount === 2);

    writeStub.reset();
    sendData(wapp, 'wrong', {});
    t.assert(writeStub.callCount === 2);

    writeStub.reset();
    sendData(wapp, 'wrong', 'wrong');
    t.assert(writeStub.callCount === 2);
});

test('stream state', async (t) => {
    const wapp = new Wapp();
    await wapp.openStream(() => {});

    sendData(wapp, 'state', {});

    t.pass();
});

test('stream installation', async (t) => {
    const wapp = new Wapp();
    await wapp.openStream(() => {});

    sendData(wapp, 'installation', { application: 'wrong' });
    sendData(wapp, 'installation', { application: 'application_id' });

    t.pass();
});

test('stream extsync', async (t) => {
    const wapp = new Wapp();
    await wapp.openStream();

    sendBody(wapp, 'extsync', { uri: 'extsync' }, {});

    sendBody(wapp, 'extsync', {
        uri: 'extsync/wappsto/editor/console',
    }, {
        time: '2021-01-01 10:12:14',
        arguments: {
            test: 'value',
            array: ['test', 'test'],
            obj: {
                test: 'test',
            },
        },
    });

    sendBody(wapp, 'extsync', {
        uri: 'extsync/wappsto/editor/console',
    }, {
        time: '2021-01-01 10:12:14',
        key: 'log',
        arguments: {
            array: ['test', 'test'],
            obj: {
                test: 'test',
            },
        },
    });

    sendBody(wapp, 'extsync', {
        uri: 'extsync/wappsto/editor/console',
    }, {
        time: '2021-01-01 10:12:14',
        key: 'error',
        arguments: {
            array: ['test', 'test'],
            obj: {
                test: 'test',
            },
        },
    });

    t.pass();
});

test('stream notification', async (t) => {
    const wapp = new Wapp();
    await wapp.openStream();

    sendData(wapp, 'notification', {
        read: 'unread',
        base: {
            code: 1100028,
        },
        custom: {
            code: 1299999,
            description: 'Test message',
        },
    });

    sendData(wapp, 'notification', {
        read: 'unread',
        base: {
            code: 1100028,
        },
        custom: {
            code: 1,
            description: 'Test message',
        },
    });

    sendData(wapp, 'notification', {
        read: 'unread',
        timestamp: '123',
        base: {
            code: 1100002,
            from: 'wrong',
        },
        custom: {
            description: 'Test message',
        },
    });

    sendData(wapp, 'notification', {
        read: 'unread',
        timestamp: '321',
        base: {
            code: 1100003,
            from: 'installation_id',
        },
        custom: {
            description: 'Test message',
        },
    });

    sendData(wapp, 'notification', {
        read: 'unread',
        timestamp: '321',
        base: {
            code: 1100003,
            from: 'installation_id',
        },
        custom: {
            description: 'Test message',
        },
    });

    sendData(wapp, 'notification', {
        read: 'unread',
        base: {
            code: 1100006,
        },
    });

    sendData(wapp, 'notification', {
        read: 'unread',
        base: {
            code: 1,
        },
    });

    sendData(wapp, 'notification', {
        read: 'read',
        base: {
            code: 1,
        },
    });

    t.pass();
});

test('stream notification req limitation', async (t) => {
    const wapp = new Wapp();
    await wapp.openStream();

    mockInquirer([{
        permission: ['network_id'],
    }]);

    sendData(wapp, 'notification', {
        read: 'unread',
        timestamp: '1234',
        base: {
            code: 1100003,
            from: 'installation_id',
        },
        custom: {
            type: 'network',
            method: ['POST'],
            quantity: 2,
            limitation: {
                name: {
                    name: ['test'],
                },
            },
            description: 'Test message',
        },
    });

    sendData(wapp, 'notification', {
        read: 'unread',
        timestamp: '12345',
        base: {
            code: 1100003,
            from: 'installation_id',
        },
        custom: {
            type: 'network',
            method: ['POST'],
            quantity: 2,
            limitation: {
                name: {
                    name: ['wrong'],
                },
            },
            description: 'Test message',
        },
    });

    t.pass();
});

test('stream notification req collection', async (t) => {
    const wapp = new Wapp();
    await wapp.openStream();

    mockInquirer([{}, {
        accept: true,
    }, {
        accept: true,
    }]);

    sendData(wapp, 'notification', {
        read: 'unread',
        timestamp: '123456',
        base: {
            code: 1100003,
            from: 'installation_id',
        },
        custom: {
            type: 'test',
            method: ['POST'],
            quantity: 2,
            collection: {

            },
        },
    });

    sendData(wapp, 'notification', {
        read: 'unread',
        timestamp: '1234567',
        base: {
            code: 1100003,
            from: 'installation_id',
        },
        custom: {
            type: 'test',
            method: ['add'],
            quantity: 2,
            collection: {

            },
        },
    });

    sendData(wapp, 'notification', {
        read: 'unread',
        timestamp: '1234568',
        base: {
            code: 1100003,
            from: 'installation_id',
        },
        custom: {
            type: 'test',
            method: ['wrong'],
            quantity: 2,
            collection: {

            },
        },
    });

    t.pass();
});

test('stream console', async (t) => {
    const wapp = new Wapp();
    await wapp.openStream();

    sendData(wapp, 'console', {});
    sendData(wapp, 'console', {}, { type: 'error', timestamp: 'now' });

    t.pass();
});
