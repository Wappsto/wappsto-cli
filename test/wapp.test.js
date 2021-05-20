import test from 'ava';

const avaSettings = require('ava/lib/concordance-options').default;
const mockInquirer = require('mock-inquirer');
const mocking = require('mock-require');
const fs = require('fs');
const tui = require('../lib/tui');
const Config = require('../lib/config');

mocking('ws', './mock/ws');

const files = require('../lib/files');
const Wapp = require('../lib/wapp');

avaSettings.theme.maxDepth = 2;
tui.write = () => {};

test.before((t) => {
    files.deleteFolder(`${Config.cacheFolder()}`);
    files.deleteFile('manifest.json');
    files.deleteFolder('foreground');
    files.deleteFolder('background');
    files.deleteFolder('icon');

    files.createFolders(`${Config.cacheFolder()}/.`);
    files.saveFile(`${Config.cacheFolder()}/session`, 'session');
    t.pass();
});

test('wapp constructor', (t) => {
    const wapp = new Wapp();
    t.deepEqual(wapp.application, {});
    t.deepEqual(wapp.manifest, {});
});

test('clean no wapp', async (t) => {
    const wapp = new Wapp();

    mockInquirer([{
        override: false,
    }]);

    await wapp.clean();

    t.false(files.directoryExists('foreground'));
    t.false(files.directoryExists('background'));
    t.false(files.directoryExists('icon'));
    t.false(files.fileExists(`${Config.cacheFolder()}/application`));
    t.false(files.fileExists(`${Config.cacheFolder()}/installation`));
    t.false(files.fileExists('manifest.json'));
});

test('create new empty wapp', async (t) => {
    console.log = t.log;
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

    t.true(files.fileExists(`${Config.cacheFolder()}/application`));
    t.true(files.fileExists(`${Config.cacheFolder()}/installation`));
    t.true(files.fileExists('manifest.json'));
    t.true(files.directoryExists('foreground'));
    t.false(files.directoryExists('background'));
    t.false(files.fileExists('foreground/index.html'));

    const manifest = files.loadJsonFile('manifest.json');
    t.is(manifest.name, answer.name);
    t.is(manifest.author, answer.author);
    t.is(manifest.version_app, answer.version);
    t.deepEqual(manifest.supported_features, answer.features);
    t.is(manifest.description.general, answer.general);
    t.is(manifest.description.foreground, answer.foreground);
});

test('update empty files', async (t) => {
    const wapp = new Wapp();

    const updatedFiles = await wapp.update();
    t.deepEqual(updatedFiles, []);
});

test('create new foreground example wapp', async (t) => {
    const wapp = new Wapp();

    const answer = {
        name: 'Test Wapp',
        author: 'author',
        version: '1.1.1',
        features: ['foreground'],
        general: 'general',
        foreground: 'foreground',
        examples: true,
    };

    mockInquirer([
        answer,
    ]);

    await wapp.create();

    t.true(files.fileExists(`${Config.cacheFolder()}/application`));
    t.true(files.fileExists(`${Config.cacheFolder()}/installation`));
    t.true(files.fileExists('manifest.json'));
    t.true(files.directoryExists('foreground'));
    t.false(files.directoryExists('background'));
    t.true(files.fileExists('foreground/index.html'));
    t.false(files.fileExists('background/package.json'));

    const manifest = files.loadJsonFile('manifest.json');
    t.is(manifest.name, answer.name);
    t.is(manifest.author, answer.author);
    t.is(manifest.version_app, answer.version);
    t.deepEqual(manifest.supported_features, answer.features);
    t.is(manifest.description.general, answer.general);
    t.is(manifest.description.foreground, answer.foreground);
    t.is(manifest.description.background, answer.background);
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

    t.true(files.fileExists(`${Config.cacheFolder()}/application`));
    t.true(files.fileExists(`${Config.cacheFolder()}/installation`));
    t.true(files.fileExists('manifest.json'));
    t.true(files.directoryExists('foreground'));
    t.true(files.directoryExists('background'));
    t.true(files.fileExists('foreground/index.html'));
    t.true(files.fileExists('background/package.json'));

    const manifest = files.loadJsonFile('manifest.json');
    t.is(manifest.name, answer.name);
    t.is(manifest.author, answer.author);
    t.is(manifest.version_app, answer.version);
    t.deepEqual(manifest.supported_features, answer.features);
    t.is(manifest.description.general, answer.general);
    t.is(manifest.description.foreground, answer.foreground);
    t.is(manifest.description.background, answer.background);
});

test('update test files', async (t) => {
    const wapp = new Wapp();

    files.createFolders('foreground/testdir/file.js');
    files.saveFile('foreground/testdir/file.js', 'file 1');

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
            name: 'foreground/testdir/file.js',
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

test('update modified and deleted files', async (t) => {
    const wapp = new Wapp();

    files.saveFile('foreground/index.html', 'modified');
    files.deleteFile('foreground/main.js');

    await wapp.init();
    const updatedFiles = await wapp.update();

    t.deepEqual(updatedFiles, [
        {
            name: 'foreground/index.html',
            status: 'updated',
        },
        {
            name: 'foreground/main.js',
            status: 'deleted',
        },
    ]);
});

test('reinstall test files', async (t) => {
    const wapp = new Wapp();
    await wapp.init();

    const updatedFiles = await wapp.update(true);

    t.deepEqual(updatedFiles, [
        {
            name: 'foreground/main.js',
            status: 'deleted',
        },
    ]);
});

test('download wapp', async (t) => {
    const wapp = new Wapp();
    console.log = t.log;
    console.debug = t.log;

    const answer = {
        create: 'download',
        wapp: 'application_id',
    };

    mockInquirer([
        answer,
    ]);

    await wapp.create();

    t.true(files.fileExists(`${Config.cacheFolder()}/application`));
    t.true(files.fileExists(`${Config.cacheFolder()}/installation`));
    t.true(files.fileExists('manifest.json'));
    t.true(files.directoryExists('foreground'));
    t.true(files.directoryExists('background'));
});

test('move files to cache folder', (t) => {
    const wapp = new Wapp();

    ['application', 'installation', 'session'].forEach((e) => {
        fs.renameSync(`${Config.cacheFolder()}/${e}`, `./.${e}`);
    });

    files.deleteFolder(`${Config.cacheFolder()}`);

    wapp.initCacheFolder();

    t.true(files.fileExists(`${Config.cacheFolder()}/application`));
    t.true(files.fileExists(`${Config.cacheFolder()}/installation`));
    t.true(files.fileExists(`${Config.cacheFolder()}/session`));
});

test('open stream', async (t) => {
    const wapp = new Wapp();

    t.is(Config.port(), 3000);
    await wapp.openStream();

    t.pass();

    // return new Promise((resolve) => {
    //   setTimeout(() => {
    //        t.is(cbSession, 'session');
    //        resolve();
    //    }, 1000);
    // });
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
    t.false(files.fileExists(`${Config.cacheFolder()}/application`));
    t.false(files.fileExists(`${Config.cacheFolder()}/installation`));
    t.false(files.fileExists('manifest.json'));
    t.true(files.fileExists(`${Config.cacheFolder()}/session`));
});
