import test from 'ava';

const avaSettings = require('ava/lib/concordance-options');
const mockInquirer = require('mock-inquirer');
const tui = require('../lib/tui');

require('./mock/backend');

const files = require('../lib/files');
const Wapp = require('../lib/wapp');

avaSettings.diff.maxDepth = 2;
tui.write = () => {};

test.before((t) => {
    files.deleteFile('.session');
    files.deleteFile('.application');
    files.deleteFile('.installation');
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

    t.is(files.loadFile('.session'), 'session');
});

test('Validate session', async (t) => {
    const wapp = new Wapp();

    await wapp.init();

    files.saveFile('.session', 'invalid');

    mockInquirer([{
        username: 'user@wappsto.com',
        password: 'password',
    }], {});

    await wapp.init();

    t.is(files.loadFile('.session'), 'session');
});
