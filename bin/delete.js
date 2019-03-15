#!/usr/bin/env node

const chalk = require('chalk');
const clui = require('clui');
const figlet = require('figlet');

const Wapp = require('../lib/wapp');
const tui = require('../lib/tui');

clui.Clear();
console.log(
    `${chalk.yellow(
        figlet.textSync('Delete Wapp', { horizontalLayout: 'full' }),
    )}\n`,
);

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
        console.log(err);
        console.log('Run error');
    }
};
run();
