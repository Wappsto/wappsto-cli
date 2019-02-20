const inquirer = require('inquirer');
const chalk = require('chalk');

module.exports = {

    askWappstoCredentials: () => {
        const questions = [
            {
                name: 'username',
                type: 'input',
                message: 'Enter your Wappsto e-mail address:',
                validate(value) {
                    if (value.length) {
                        return true;
                    }
                    return 'Please enter your e-mail address.';
                },
            },
            {
                name: 'password',
                type: 'password',
                message: 'Enter your password:',
                validate(value) {
                    if (value.length) {
                        return true;
                    }
                    return 'Please enter your password.';
                },
            },
        ];
        return inquirer.prompt(questions);
    },

    overrideWapp: () => {
        module.exports.showWarning('It seams like you already have a wapp in this folder!');
        const questions = [
            {
                name: 'override',
                type: 'confirm',
                default: false,
                message: 'Do you want to delete it?',
            },
        ];
        return inquirer.prompt(questions);
    },

    loadOldWapp: () => {
        const questions = [
            {
                name: 'load',
                type: 'confirm',
                message: 'Do you want to load an existing Wapp?',
            },
        ];
        return inquirer.prompt(questions);
    },

    deleteWapp: () => {
        const questions = [
            {
                name: 'del',
                type: 'confirm',
                message: 'Do you want to delete the Wapp?',
                default: false,
            },
            {
                name: 'local',
                type: 'confirm',
                message: 'Do you want to delete the local files?',
                when: answer => answer.del,
            },
            {
                name: 'remote',
                type: 'confirm',
                message: 'Do you want to delete the Wapp on Wappsto?',
                when: answer => answer.del,
            },
        ];
        return inquirer.prompt(questions);
    },

    listWapps: (wapps) => {
        const questions = [
            {
                name: 'wapp',
                type: 'list',
                message: 'Please choose the wapp to download:',
                choices: wapps,
            },
        ];
        return inquirer.prompt(questions);
    },

    askForNewWapp: () => {
        const questions = [
            {
                name: 'name',
                type: 'input',
                message: 'Please enter the name of your Wapp:',
                validate: (answer) => {
                    if (answer === '') {
                        return "Name can't be empty";
                    }
                    return true;
                },
            },
            {
                name: 'features',
                type: 'checkbox',
                message: 'Please choose features for the Wapp:',
                choices: [
                    {
                        name: 'Foreground',
                        value: 'foreground',
                        checked: true,
                    },
                    {
                        name: 'background',
                        value: 'background',
                    }],
                validate: (answer) => {
                    if (answer.length === 0) {
                        return 'You must select at least one feature';
                    }
                    return true;
                },
            },
            {
                name: 'examples',
                type: 'confirm',
                message: 'Generate example files for the Wapp?',
                default: true,
            },
        ];
        return inquirer.prompt(questions);
    },

    showMessage: (msg, str, end = '\n') => {
        process.stdout.write(`${chalk.green('*')} ${chalk.whiteBright.bold(msg)}`);
        if (str) {
            process.stdout.write(str);
        }
        process.stdout.write(end);
    },

    showWarning: (msg) => {
        process.stdout.write(`${chalk.red('!')} ${chalk.yellow.bold(msg)}\n`);
    },

    showError: (msg) => {
        process.stdout.write(`${chalk.red('!')} ${chalk.red.bold(msg)}\n`);
    },
};
