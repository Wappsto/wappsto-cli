#!/usr/bin/env node

const Wapp = require('../lib/wapp');
const tui = require('../lib/tui');

let reinstall = false;

for (let j = 2; j < process.argv.length; j += 1) {
    switch (process.argv[j]) {
    case '--reinstall':
        reinstall = true;
        break;
    default:
        tui.showError(`Unknown parameter: ${process.argv[j]}`);
        process.exit(-1);
    }
}

const run = async () => {
    try {
        const wapp = new Wapp();
        await wapp.init();

        const files = await wapp.update(reinstall);
        files.forEach((f) => {
            tui.showMessage(`${f.name} was ${f.status}`);
        });
    } catch (err) {
        console.error(err);
        console.error('Run error');
    }
};
run();
