const test = require('ava');
const util = require('util');
const mockInquirer = require('mock-inquirer');
const mocking = require('mock-require');
const fs = require('fs');

mocking('ws', './mock/ws');

const tui = require('../lib/tui');
const Config = require('../lib/config');
const files = require('../lib/files');
const Wapp = require('../lib/wapp');

util.inspect.defaultOptions.depth = 5; // Increase AVA's printing depth

tui.write = () => {};
tui.showError = () => {};

// process.chdir('/tmp');

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
    t.deepEqual(wapp.application.data, {});
    t.deepEqual(wapp.application.version, []);
    t.deepEqual(wapp.manifest, {});
});

test('clean no wapp', async (t) => {
    const wapp = new Wapp();

    mockInquirer([{
        override: false,
    }]);

    await wapp.clean();

    t.deepEqual(files.directoryExists('foreground'), false);
    t.deepEqual(files.directoryExists('background'), false);
    t.deepEqual(files.directoryExists('icon'), false);
    t.deepEqual(files.fileExists(`${wapp.cacheFolder}/application`), false);
    t.deepEqual(files.fileExists(`${wapp.cacheFolder}/installation`), false);
    t.deepEqual(files.fileExists('manifest.json'), false);
});

test('create new empty wapp', async (t) => {
    // console.log = t.log;
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

    t.deepEqual(files.fileExists(`${wapp.cacheFolder}/application`), true);
    t.deepEqual(files.fileExists(`${wapp.cacheFolder}/installation`), true);
    t.deepEqual(files.fileExists('manifest.json'), true);
    t.deepEqual(files.directoryExists('foreground'), true);
    t.deepEqual(files.directoryExists('background'), false);
    t.deepEqual(files.fileExists('foreground/index.html'), false);

    const manifest = files.loadJsonFile('manifest.json');
    t.deepEqual(manifest.name, answer.name);
    t.deepEqual(manifest.author, answer.author);
    t.deepEqual(manifest.version_app, answer.version);
    t.deepEqual(manifest.supported_features, answer.features);
    t.deepEqual(manifest.description.general, answer.general);
    t.deepEqual(manifest.description.foreground, answer.foreground);
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

    t.deepEqual(files.fileExists(`${wapp.cacheFolder}/application`), true);
    t.deepEqual(files.fileExists(`${wapp.cacheFolder}/installation`), true);
    t.deepEqual(files.fileExists('manifest.json'), true);
    t.deepEqual(files.directoryExists('foreground'), true);
    t.deepEqual(files.directoryExists('background'), false);
    t.deepEqual(files.fileExists('foreground/index.html'), true);
    t.deepEqual(files.fileExists('background/package.json'), false);

    const manifest = files.loadJsonFile('manifest.json');
    t.deepEqual(manifest.name, answer.name);
    t.deepEqual(manifest.author, answer.author);
    t.deepEqual(manifest.version_app, answer.version);
    t.deepEqual(manifest.supported_features, answer.features);
    t.deepEqual(manifest.description.general, answer.general);
    t.deepEqual(manifest.description.foreground, answer.foreground);
    t.deepEqual(manifest.description.background, answer.background);
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

    t.deepEqual(files.fileExists(`${wapp.cacheFolder}/application`), true);
    t.deepEqual(files.fileExists(`${wapp.cacheFolder}/installation`), true);
    t.deepEqual(files.fileExists('manifest.json'), true);
    t.deepEqual(files.directoryExists('foreground'), true);
    t.deepEqual(files.directoryExists('background'), true);
    t.deepEqual(files.fileExists('foreground/index.html'), true);
    t.deepEqual(files.fileExists('background/package.json'), true);

    const manifest = files.loadJsonFile('manifest.json');
    t.deepEqual(manifest.name, answer.name);
    t.deepEqual(manifest.author, answer.author);
    t.deepEqual(manifest.version_app, answer.version);
    t.deepEqual(manifest.supported_features, answer.features);
    t.deepEqual(manifest.description.general, answer.general);
    t.deepEqual(manifest.description.foreground, answer.foreground);
    t.deepEqual(manifest.description.background, answer.background);
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
    files.createFolders('background/node_modules/ws/index.js');
    files.createFolders('background/ws/index.js');
    files.saveFile('background/ws/index.js', 'modified');
    files.saveFile('background/node_modules/ws/index.js', 'modified');
    files.saveFile('background/test.js', 'modified');

    t.deepEqual(files.directoryExists('background/node_modules'), true);

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
        {
            name: 'background/test.js',
            status: 'created',
        },
        {
            name: 'background/ws/index.js',
            status: 'created',
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
    // console.log = t.log;
    // console.debug = t.log;

    const answer = {
        create: 'download',
        wapp: 'application_id',
    };

    mockInquirer([
        answer,
    ]);

    await wapp.create();

    t.deepEqual(files.fileExists(`${wapp.cacheFolder}/application`), true);
    t.deepEqual(files.fileExists(`${wapp.cacheFolder}/installation`), true);
    t.deepEqual(files.fileExists('manifest.json'), true);
    t.deepEqual(files.directoryExists('foreground'), true);
    t.deepEqual(files.directoryExists('background'), true);
});

test('move files to cache folder', (t) => {
    const wapp = new Wapp();

    ['application', 'installation', 'session'].forEach((e) => {
        fs.renameSync(`${wapp.cacheFolder}/${e}`, `./.${e}`);
    });

    files.deleteFolder(`${wapp.cacheFolder}`);

    wapp.initCacheFolder();

    t.deepEqual(files.fileExists(`${wapp.cacheFolder}/application`), true);
    t.deepEqual(files.fileExists(`${wapp.cacheFolder}/installation`), true);
    t.deepEqual(files.fileExists(`${wapp.cacheFolder}/session`), true);
});

test('open stream', async (t) => {
    const wapp = new Wapp();

    t.deepEqual(Config.port(), 3000);
    await wapp.openStream();

    t.pass();

    // return new Promise((resolve) => {
    //   setTimeout(() => {
    //        t.deepEqual(cbSession, 'session');
    //        resolve();
    //    }, 1000);
    // });
});

test('generate new wapp from local', async (t) => {
    const wapp = new Wapp();

    const answer = {
        create: 'generate',
    };

    mockInquirer([answer]);

    await wapp.create();

    t.deepEqual(files.fileExists(`${wapp.cacheFolder}/application`), true);
    t.deepEqual(files.fileExists(`${wapp.cacheFolder}/installation`), true);
    t.deepEqual(files.fileExists('manifest.json'), true);
    t.deepEqual(files.directoryExists('foreground'), true);
    t.deepEqual(files.directoryExists('background'), true);
});

test('delete wapp', async (t) => {
    const wapp = new Wapp();

    mockInquirer([{
        del: true,
        local: true,
        remote: true,
    }]);

    await wapp.delete();

    t.deepEqual(files.directoryExists('foreground'), false);
    t.deepEqual(files.directoryExists('background'), false);
    t.deepEqual(files.directoryExists('icon'), false);
    t.deepEqual(files.fileExists(`${wapp.cacheFolder}/application`), false);
    t.deepEqual(files.fileExists(`${wapp.cacheFolder}/installation`), false);
    t.deepEqual(files.fileExists('manifest.json'), false);
    t.deepEqual(files.fileExists(`${wapp.cacheFolder}/session`), true);
});

test('create new custom wapp', async (t) => {
    const data = {
        foreground: 'customForeground',
        background: 'customBackground',
        host: 'https://customHost.com',
        port: 4000,
        cacheFolder: 'customFolder',
    };
    files.saveJsonFile('wappsto.json', data);

    Config.reload();

    const wapp = new Wapp();

    const answer = {
        username: 'user@wappsto.com',
        password: 'password',
        name: 'Test Wapp',
        author: 'author',
        version: '1.1.1',
        features: ['foreground'],
        general: 'general',
        foreground: 'customForeground',
        examples: false,
    };

    mockInquirer([answer]);

    await wapp.create();

    t.deepEqual(files.fileExists(`${wapp.cacheFolder}/application`), true);
    t.deepEqual(files.fileExists(`${wapp.cacheFolder}/installation`), true);
    t.deepEqual(files.fileExists('manifest.json'), true);
    t.deepEqual(files.directoryExists('customForeground'), true);
    t.deepEqual(files.directoryExists('customBackground'), false);
    t.deepEqual(files.directoryExists('background'), false);
    t.deepEqual(files.fileExists('customForeground/index.html'), false);

    const manifest = files.loadJsonFile('manifest.json');
    t.deepEqual(manifest.name, answer.name);
    t.deepEqual(manifest.author, answer.author);
    t.deepEqual(manifest.version_app, answer.version);
    t.deepEqual(manifest.supported_features, answer.features);
    t.deepEqual(manifest.description.general, answer.general);
    t.deepEqual(manifest.description.foreground, answer.foreground);
});

test('delete custom wapp', async (t) => {
    const wapp = new Wapp();

    mockInquirer([{
        del: true,
        local: true,
        remote: true,
    }]);

    await wapp.delete();

    t.deepEqual(files.directoryExists('customForeground'), false);
    t.deepEqual(files.directoryExists('customBackground'), false);
    t.deepEqual(files.directoryExists('foreground'), false);
    t.deepEqual(files.directoryExists('background'), false);
    t.deepEqual(files.directoryExists('icon'), false);
    t.deepEqual(files.fileExists(`${wapp.cacheFolder}/application`), false);
    t.deepEqual(files.fileExists(`${wapp.cacheFolder}/installation`), false);
    t.deepEqual(files.fileExists('manifest.json'), false);

    files.deleteFile('wappsto.json');
});
