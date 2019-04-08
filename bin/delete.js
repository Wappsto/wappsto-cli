#!/usr/bin/env node

const Wapp = require('../lib/wapp');
const tui = require('../lib/tui');

tui.header('Delete Wapp');

const run = async () => {
    try {
        const wapp = new Wapp();
        if (wapp.present()) {
            await wapp.init();
            await wapp.delete();
        } else {
            tui.showError('No Wapp found in current folder');
        }
    } catch (err) {
        console.error(err);
        console.error('Run error');
    }
};
run();
