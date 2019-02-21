import test from 'ava';
const fs = require('fs');
const files = require('../lib/files');
const path = 'test1/test2/';
const file = 'test1/test2/test.js';

test('getCurrentDirectoryBase', (t) => {
    const path = files.getCurrentDirectoryBase();
    t.regex(path, new RegExp('wappsto-cli', 'g'));
});

test('directoryExists exists', (t) => {
    t.true(files.directoryExists('test'));
    t.false(files.directoryExists('wrong'));
});

test('fileExists', (t) => {
    t.true(files.fileExists('test/files.test.js'));
    t.false(files.fileExists('wrong'));
});

test('createFolders', (t) => {
    t.false(files.directoryExists(path));
    files.createFolders(file);
    t.true(files.directoryExists(path));
});

test('loadFile', (t) => {
    t.is(files.loadFile(file), '');
    t.deepEqual(files.loadJsonFile(file), {});

    fs.appendFileSync(file, '{"test": "test"}');

    t.is(files.loadFile(file), '{"test": "test"}');
    t.deepEqual(files.loadJsonFile(file), {test: "test"});
});

test('getAllFiles', (t) => {
    t.deepEqual(files.getAllFiles('test2'), []);
    t.deepEqual(files.getAllFiles('test1'), [file]);
});

test('deleteFile', (t) => {
    t.true(files.fileExists(file));
    files.deleteFile('test2');
    files.deleteFile(file);
    t.false(files.fileExists(file));
});

test('deleteFolder', (t) => {
    fs.appendFileSync(file, '{"test": "test"}');
    t.true(files.directoryExists(path));
    files.deleteFolder('test1');
    t.false(files.directoryExists(path));
});
