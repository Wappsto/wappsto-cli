#!/usr/bin/env node

const Wapp = require('../lib/wapp');

const run = async () => {
    try {
        const wapp = new Wapp();
        await wapp.init();

        const files = await wapp.upload();
        files.forEach((f) => {
            console.log(f+' was uploaded to wappsto');
        });
    } catch (err) {
        console.error(err);
        console.error('Run error');
    }
};
run();
