const Inquirer = require('inquirer');
const chalk = require('chalk');

module.exports = {
    clear: () => {
        // Ansi code for clearing screen
        module.exports.write('\x1B[2J\x1B[0;0f');
    },

    askWappstoCredentials: (host) => {
        const questions = [
            {
                name: 'username',
                type: 'input',
                message: `Enter your ${host} e-mail address:`,
                validate: (value) => {
                    if (value === '') {
                        return 'Please enter your e-mail address.';
                    }
                    return true;
                },
            },
            {
                name: 'password',
                type: 'password',
                message: 'Enter your password:',
                validate: (value) => {
                    if (value === '') {
                        return 'Please enter your password.';
                    }
                    return true;
                },
            },
        ];
        return Inquirer.prompt(questions);
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
        return Inquirer.prompt(questions);
    },

    loadOldWapp: () => {
        const questions = [
            {
                name: 'load',
                type: 'confirm',
                message: 'Do you want to load an existing Wapp?',
            },
        ];
        return Inquirer.prompt(questions);
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
        return Inquirer.prompt(questions);
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
        return Inquirer.prompt(questions);
    },

    precisePermissionRequest: (request) => {
        let msg = '';
        if (request.message) {
            msg = request.message;
        } else {
            msg = `${request.name_installation} would like to save data under your account. Allow?`;
        }
        const questions = [
            {
                name: 'accept',
                type: 'confirm',
                message: msg,
            },
        ];
        return Inquirer.prompt(questions);
    },

    permissionRequest: (request, data) => {
        let msg = '';
        if (request.message) {
            msg = request.message;
        } else {
            msg = `Please choose the ${request.type} to share with ${request.name_installation}:`;
        }
        const questions = [
            {
                name: 'permission',
                type: 'checkbox',
                message: msg,
                choices: data,
            },
        ];
        return Inquirer.prompt(questions);
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
                name: 'author',
                type: 'input',
                message: 'Please enter the Author of your Wapp:',
            },
            {
                name: 'version',
                type: 'input',
                message: 'Please enter the Version of your Wapp:',
                validate: (answer) => {
                    if (/^\d\.\d\.\d$/.test(answer)) {
                        return true;
                    }
                    return 'Version must be in the format: 1.1.1';
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
                    if (answer && answer.length === 0) {
                        return 'You must select at least one feature';
                    }
                    return true;
                },
            },
            {
                name: 'general',
                type: 'input',
                message: 'Please enter a general descrption about your Wapp:',
            },
            {
                name: 'foreground',
                type: 'input',
                message: 'Please enter a description about your foreground part of your Wapp:',
                when: answer => answer.features.indexOf('foreground') !== -1,
            },
            {
                name: 'background',
                type: 'input',
                message: 'Please enter a description about your background part of your Wapp:',
                when: answer => answer.features.indexOf('background') !== -1,
            },
            {
                name: 'examples',
                type: 'confirm',
                message: 'Generate example files for the Wapp?',
                default: false,
            },
        ];
        return Inquirer.prompt(questions);
    },

    remoteVersionUpdated: () => {
        const questions = [
            {
                name: 'local',
                type: 'confirm',
                default: true,
                message: 'Do you want to override local version information with remote information?',
            },
        ];
        return Inquirer.prompt(questions);
    },

    fileConflict: (file) => {
        const questions = [
            {
                message: `Conflict on file ´${file}`,
                name: 'conflict',
                type: 'expand',
                choices: [{
                    key: 'o',
                    name: 'Overwrite local file with remote file',
                    value: 'overwrite',
                },
                {
                    key: 'u',
                    name: 'Upload local file to server',
                    value: 'upload',
                },
                {
                    key: 'a',
                    name: 'Overwrite this local file and all next',
                    value: 'overwrite_all',
                },
                {
                    key: 's',
                    name: 'Upload this local file and all next',
                    value: 'upload_all',
                },
                {
                    key: 'd',
                    name: 'Show diff',
                    value: 'diff',
                },
                {
                    key: 'x',
                    name: 'Abort',
                    value: 'abort',
                }],
            },
        ];
        return Inquirer.prompt(questions);
    },

    askDeleteLocalFile: (file) => {
        const questions = [
            {
                name: 'delete',
                type: 'confirm',
                default: true,
                message: `${file} was deleted on the server, do you want to delete the local file?`,
            },
        ];
        return Inquirer.prompt(questions);
    },

    showMessage: (msg, str, end = '\n') => {
        module.exports.write(`${chalk.green('*')} ${chalk.whiteBright.bold(msg)}`);
        if (str) {
            module.exports.write(str);
        }
        module.exports.write(end);
    },

    showStatus: (msg) => {
        module.exports.write(`${chalk.green('*')} ${chalk.green.bold(msg)}\n`);
    },

    showWarning: (msg) => {
        module.exports.write(`${chalk.red('!')} ${chalk.yellow.bold(msg)}\n`);
    },

    showError: (msg) => {
        module.exports.write(`${chalk.red('!')} ${chalk.red.bold(msg)}\n`);
    },

    write: (msg) => {
        process.stdout.write(msg);
    },
};
