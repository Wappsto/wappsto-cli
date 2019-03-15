import test from 'ava';

const mockInquirer = require('mock-inquirer');
const Configstore = require('configstore');
const mocking = require('mock-require');
const pkg = require('../package.json');

require('./mock/backend');

mocking('ws', './mock/ws');
mocking('clui', './mock/clui');

const files = require('../lib/files');
const Wapp = require('../lib/wapp');


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
    t.true(files.fileExists('.installation'));
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

    await wapp.clean();

    t.true(files.fileExists('.application'));
    t.true(files.fileExists('.installation'));
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
    t.true(files.fileExists('.installation'));
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
    t.false(files.fileExists('.installation'));
    t.false(files.fileExists('manifest.json'));
});
