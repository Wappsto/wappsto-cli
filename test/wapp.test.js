import test from 'ava';

const mockInquirer = require('mock-inquirer');
const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');
const Configstore = require('configstore');
const pkg = require('../package.json');

const files = require('../lib/files');
const Wapp = require('../lib/wapp');

// This sets the mock adapter on the default instance
const mock = new MockAdapter(axios);

mock.onPatch('https://wappsto.com/services/version/version_id').reply(200, [])
    .onDelete('https://wappsto.com/services/application/application_id').reply(200, [])
    .onDelete('https://wappsto.com/services/version/version_id')
    .reply(200, [])
    .onDelete('https://wappsto.com/services/installation?this_version_id=version_id')
    .reply(200, []);

const conf = new Configstore(pkg.name);
conf.delete('session');

test('constructor', (t) => {
    const wapp = new Wapp();
    t.deepEqual(wapp.application, {});
    t.deepEqual(wapp.manifest, {});
});

test('Login Fail', async (t) => {
    const wapp = new Wapp();
    mock.onPost('https://wappsto.com/services/session').replyOnce(401);
    mockInquirer([{
        username: 'user@wappsto.com',
        password: 'password',
    }]);

    try {
        await wapp.init();
        t.fail();
    } catch (err) {
        t.is(err.message, 'LoginError');
    }
});

test('Login', async (t) => {
    const wapp = new Wapp();
    mock.onPost('https://wappsto.com/services/session').replyOnce(200, {
        meta: {
            id: 'session',
        },
    });
    mockInquirer([{
        username: 'user@wappsto.com',
        password: 'password',
    }], {});

    await wapp.init();

    t.is(conf.get('session'), 'session');
});

test('clean no wapp', async (t) => {
    const wapp = new Wapp();

    mockInquirer([{
        override: true,
    }]);

    await wapp.clean();

    t.pass();
});

test('create new empty wapp', async (t) => {
    const wapp = new Wapp();
    mock.onGet('https://wappsto.com/services/application?expand=2&verbose=true').replyOnce(200, [])
        .onPost('https://wappsto.com/services/application').replyOnce(201, {
            meta: {
                id: 'application_id',
            },
            version: [{
                meta: {
                    id: 'version_id',
                },
                name: 'Wapp Test',
                file: [],
            }],
        });
    mockInquirer([{
        name: 'Test Wapp',
        features: ['foreground'],
        examples: false,
    }]);

    await wapp.create();

    t.true(files.directoryExists('foreground'));
    t.false(files.directoryExists('background'));
});

test('update files', async (t) => {
    const wapp = new Wapp();

    mock.onGet('https://wappsto.com/services/application/application_id').replyOnce(200, {
        meta: {
            id: 'application_id',
        },
        version: [{
            meta: {
                id: 'version_id',
            },
            name: 'Wapp Test',
            file: [],
        }],
    });

    const updatedFiles = await wapp.update();

    t.deepEqual(updatedFiles, []);
});

test('delete wapp', async (t) => {
    const wapp = new Wapp();

    mockInquirer([{
        del: true,
        local: true,
        remote: true,
    }]);

    await wapp.delete();

    t.false(files.directoryExists('foreground'));
    t.false(files.directoryExists('background'));
    t.false(files.directoryExists('icon'));
    t.false(files.fileExists('.application'));
    t.false(files.fileExists('manifest.json'));
});
