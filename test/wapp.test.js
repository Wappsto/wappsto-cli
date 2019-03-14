import test from 'ava';

const WebSocket = require('ws');
const mockInquirer = require('mock-inquirer');
const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');
const Configstore = require('configstore');
const pkg = require('../package.json');

const files = require('../lib/files');
const Wapp = require('../lib/wapp');

const mock = new MockAdapter(axios);

WebSocket.constructor = (endpoint) => {
    WebSocket.endpoint = endpoint;
};
WebSocket.on = (ev, func) => {
    console.log(ev);
    WebSocket[ev] = func;
};

mock.onAny().reply((options) => {
    const url = options.url.indexOf('services') !== -1 ? options.url.split('/services/')[1] : options.url.split('/files/')[1];
    const { method } = options;
    let data = {};

    try {
        if (options.data && options.data[0] === '{') {
            data = JSON.parse(options.data);
        }
    } catch (err) {
        console.log(options.data);
        console.log(err);
    }

    let status = 501;
    let res = {};
    switch (url) {
    case 'session':
        if (data.username === 'user@wappsto.com' && data.password === 'password') {
            status = 200;
            res = {
                meta: {
                    id: 'session',
                },
            };
        } else {
            status = 401;
        }
        break;
    case 'application':
        if (method) {
            status = 201;
            res = {
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
            };
        } else {
            status = 200;
        }
        break;
    case 'application?expand=2&verbose=true':
        status = 200;
        res = [];
        break;
    case 'application?verbose=true':
        status = 201;
        res = {
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
        };
        break;
    case 'application/application_id?expand=2&verbose=true':
    case 'application/application_id':
        if (method === 'get') {
            status = 200;
            res = {
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
            };
        } else if (method === 'delete') {
            status = 200;
        }
        break;
    case 'installation':
        status = 201;
        res = {
            meta: {
                id: 'installation_id',
            },
        };
        break;
    case 'installation?this_version_id=version_id':
        status = 200;
        break;
    case 'installation/installation_id':
        if (method === 'patch') {
            status = 200;
        }
        break;
    case 'installation?expand=2&this_version_id=version_id':
        status = 200;
        res = {};
        break;
    case 'version/version_id?verbose=true':
        status = 200;
        res = {
            meta: {
                id: 'version_id',
                revision: 1,
            },
            file: [{
                meta: {
                    id: 'file_id',
                },
            }],
        };
        break;
    case 'version/version_id':
        if (method === 'delete') {
            status = 200;
        } else if (method === 'patch') {
            status = 200;
            res = {
                meta: {
                    id: 'version_id',
                },
                file: [{
                    meta: {
                        id: 'file_id',
                    },
                }],
            };
        } else if (method === 'put') {
            status = 200;
        }
        break;
    case 'files/file/file_id':
        status = 200;
        res = 'file content';
        break;
    case 'stream':
        status = 200;
        res = {
            meta: {
                id: 'stream_id',
            },
        };
        break;
    case 'stream?expand=2':
        status = 200;
        break;
    default:
        break;
    }
    if (status === 501) {
        console.debug('unhandled');
        console.debug(options);
    }
    return [status, res];
});

const conf = new Configstore(pkg.name);
conf.delete('session');

test('constructor', (t) => {
    const wapp = new Wapp();
    t.deepEqual(wapp.application, {});
    t.deepEqual(wapp.manifest, {});
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
        t.is(err.message, 'Validation failed for field username');
    }

    try {
        await wapp.init();
        t.fail();
    } catch (err) {
        t.is(err.message, 'Validation failed for field password');
    }

    try {
        await wapp.init();
        t.fail();
    } catch (err) {
        t.is(err.message, 'LoginError');
    }
});

test('Login', async (t) => {
    const wapp = new Wapp();

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

    mockInquirer([{
        name: 'Test Wapp',
        author: 'author',
        version: '1.1.1',
        features: ['foreground'],
        general: 'general',
        foreground: 'foreground',
        examples: false,
    }]);

    await wapp.create();

    t.true(files.fileExists('.application'));
    t.true(files.fileExists('manifest.json'));
    t.true(files.directoryExists('foreground'));
    t.false(files.directoryExists('background'));
    t.false(files.fileExists('foreground/index.html'));
});

test('do not override wapp', async (t) => {
    const wapp = new Wapp();

    mockInquirer([{
        override: false,
    }]);

    await wapp.create();

    t.true(files.fileExists('.application'));
    t.true(files.fileExists('manifest.json'));
    t.true(files.directoryExists('foreground'));
    t.false(files.directoryExists('background'));
    t.false(files.fileExists('foreground/index.html'));
});

test('update empty files', async (t) => {
    const wapp = new Wapp();

    const updatedFiles = await wapp.update();
    t.log(updatedFiles);
    t.deepEqual(updatedFiles, []);
});

test('create new example wapp', async (t) => {
    const wapp = new Wapp();

    mockInquirer([{
        override: true,
    }, {
        name: 'Test Wapp',
        author: 'author',
        version: '1.1.1',
        features: ['foreground', 'background'],
        general: 'general',
        foreground: 'foreground',
        examples: true,
    }]);

    await wapp.create();

    t.true(files.fileExists('.application'));
    t.true(files.fileExists('manifest.json'));
    t.true(files.directoryExists('foreground'));
    t.true(files.directoryExists('background'));
    t.true(files.fileExists('foreground/index.html'));
    t.true(files.fileExists('background/package.json'));
});

test('update test files', async (t) => {
    const wapp = new Wapp();

    const updatedFiles = await wapp.update();

    t.deepEqual(updatedFiles, [
        {
            name: 'foreground/index.html',
            status: 'created',
        },
        {
            name: 'foreground/main.js',
            status: 'created',
        },
        {
            name: 'background/main.js',
            status: 'created',
        },
        {
            name: 'background/package.json',
            status: 'created',
        },
    ]);
});

test('open stream', async (t) => {
    const wapp = new Wapp();
    console.log = t.log;
    console.debug = t.log;

    let cbSession = '';
    await wapp.openStream((session) => {
        cbSession = session;
    });

    return new Promise((resolve) => {
        setTimeout(() => {
            t.is(cbSession, 'session');
            resolve();
        }, 1000);
    });
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
