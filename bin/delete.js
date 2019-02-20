#!/usr/bin/env node

const chalk = require('chalk');
const clear = require('clear');
const figlet = require('figlet');

const Wapp = require('../lib/wapp');

clear();
console.log(
    `${chalk.yellow(
        figlet.textSync('Delete Wapp', { horizontalLayout: 'full' }),
    )}\n`,
);

const run = async () => {
    try {
        const wapp = new Wapp();
        await wapp.init();
        await wapp.delete();
    } catch (err) {
        console.log(err);
        console.log('Run error');
    }
};
run();
