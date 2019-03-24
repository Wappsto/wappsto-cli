#!/usr/bin/env node

const chalk = require('chalk');
const figlet = require('figlet');

const Wapp = require('../lib/wapp');
const tui = require('../lib/tui');

tui.clear();
console.log(
    `${chalk.yellow(
        figlet.textSync('Create Wapp', { horizontalLayout: 'full' }),
    )}\n`,
);

const run = async () => {
    try {
        const wapp = new Wapp();
        await wapp.init();
        if (await wapp.clean()) {
            await wapp.create();
        }
    } catch (err) {
        if (err.message === 'LoginError') {
            tui.showError('Failed to Login, please try again.');
        } else {
            console.log(err);
            console.log('Run error');
        }
        process.exit(-1);
    }
};
run();
