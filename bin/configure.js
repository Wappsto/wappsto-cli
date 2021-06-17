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
    {
        name: 'verbose',
        description: 'Enable verbose output.',
        alias: 'v',
        type: Boolean,
    },
];

const sections = [
    {
        header: 'Configure Wapp',
        content: 'Script to change settings for your wapp on wappsto.',
    },
    {
        header: 'Synopsis',
        content: [
            '$ update-wapp',
            '$ update-wapp {bold --verbose}',
            '$ update-wapp {bold --help}',
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

const run = async () => {
    try {
        const wapp = new Wapp(options.verbose);
        await wapp.init();

        await wapp.configure();
    } catch (err) {
        tui.showError('Run error', err);
    }
};
run();
