#!/usr/bin/env node

const Wapp = require('../lib/wapp');
const tui = require('../lib/tui');

tui.header('Create Wapp');

const run = async () => {
    try {
        const wapp = new Wapp();
        await wapp.init();
        await wapp.create();
    } catch (err) {
        if (err.message === 'LoginError') {
            tui.showError('Failed to Login, please try again.');
        } else {
            console.error(err);
            console.error('Run error');
        }
        process.exit(-1);
    }
};
run();
