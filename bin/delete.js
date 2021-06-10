#!/usr/bin/env node

const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');
const Wapp = require('../lib/wapp');
const tui = require('../lib/tui');

const optionDefinitions = [
    {
        name: 'help',
        description: 'Display this usage guide.',
        alias: 'h',
        type: Boolean,
    },
];

const sections = [
    {
        header: 'Delete Wapp',
        content: 'Script to delete the Wapp on Wappsto.',
    },
    {
        header: 'Synopsis',
        content: [
            '$ delete-wapp',
            '$ delete-wapp {bold --help}',
        ],
    },
    {
        header: 'Options',
        optionList: optionDefinitions,
    },
    {
        content: 'Project home: {underline https://github.com/wappsto/wappsto-cli}',
    },
];

const options = commandLineArgs(optionDefinitions);

if (options.help) {
    process.stdout.write(commandLineUsage(sections));
    process.exit();
}

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
        tui.showError('Run error', err);
    }
};
run();
