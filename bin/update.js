#!/usr/bin/env node

const Wapp = require('../lib/wapp');
const inquirer = require('../lib/inquirer');

const run = async () => {
    try {
        const wapp = new Wapp();
        await wapp.init();

        const files = await wapp.update();
        files.forEach((f) => {
            inquirer.showMessage(`${f.name} was ${f.status}`);
        });
    } catch (err) {
        console.error(err);
        console.error('Run error');
    }
};
run();
