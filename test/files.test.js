import test from 'ava';

const files = require('../lib/files');

test('getCurrentDirectoryBase', (t) => {
    const path = files.getCurrentDirectoryBase();
    t.regex(path, new RegExp('wappsto-cli', 'g'));
});

test('directoryExists exists', (t) => {
    const result = files.directoryExists('test');
    t.is(result, true);
});

test('directoryExists do not exists', (t) => {
    const result = files.directoryExists('wrong');
    t.is(result, false);
});
