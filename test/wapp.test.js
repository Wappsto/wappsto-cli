import test from 'ava';

const avaSettings = require('ava/lib/concordance-options');

avaSettings.diff.maxDepth = 2;

const mockInquirer = require('mock-inquirer');
const mocking = require('mock-require');

require('./mock/backend');

mocking('ws', './mock/ws');
mocking('clui', './mock/clui');

const files = require('../lib/files');
const Wapp = require('../lib/wapp');

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

    t.is(files.loadFile('.session'), 'session');
});

test('clean no wapp', async (t) => {
    const wapp = new Wapp();

    mockInquirer([{
        override: false,
    }]);

    await wapp.clean();

    t.pass();
});

test('create new empty wapp', async (t) => {
    const wapp = new Wapp();

    const answer = {
        name: 'Test Wapp',
        author: 'author',
        version: '1.1.1',
        features: ['foreground'],
        general: 'general',
        foreground: 'foreground',
        examples: false,
    };

    mockInquirer([answer]);

    await wapp.create();

    t.true(files.fileExists('.application'));
    t.true(files.fileExists('.installation'));
    t.true(files.fileExists('manifest.json'));
    t.true(files.directoryExists('foreground'));
    t.false(files.directoryExists('background'));
    t.false(files.fileExists('foreground/index.html'));

    const manifest = files.loadJsonFile('manifest.json');
    t.is(answer.name, manifest.name);
    t.is(answer.author, manifest.author);
    t.is(answer.version, manifest.version_app);
    t.deepEqual(answer.features, manifest.supported_features);
    t.is(answer.general, manifest.description.general);
    t.is(answer.foreground, manifest.description.foreground);
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
    t.deepEqual(updatedFiles, []);
});

test('create new example wapp', async (t) => {
    const wapp = new Wapp();

    const answer = {
        name: 'Test Wapp',
        author: 'author',
        version: '1.1.1',
        features: ['foreground', 'background'],
        general: 'general',
        foreground: 'foreground',
        examples: true,
    };

    mockInquirer([
        answer,
    ]);

    await wapp.create();

    t.true(files.fileExists('.application'));
    t.true(files.fileExists('.installation'));
    t.true(files.fileExists('manifest.json'));
    t.true(files.directoryExists('foreground'));
    t.true(files.directoryExists('background'));
    t.true(files.fileExists('foreground/index.html'));
    t.true(files.fileExists('background/package.json'));

    const manifest = files.loadJsonFile('manifest.json');
    t.is(answer.name, manifest.name);
    t.is(answer.author, manifest.author);
    t.is(answer.version, manifest.version_app);
    t.deepEqual(answer.features, manifest.supported_features);
    t.is(answer.general, manifest.description.general);
    t.is(answer.foreground, manifest.description.foreground);
    t.is(answer.background, manifest.description.background);
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

    await wapp.openStream();

    t.pass();
    /*
    return new Promise((resolve) => {
        setTimeout(() => {
            t.is(cbSession, 'session');
            resolve();
        }, 1000);
    });
*/
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
    t.true(files.fileExists('.session'));
});
