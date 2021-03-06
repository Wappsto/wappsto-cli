/* eslint class-methods-use-this: "off" */
const Inquirer = require('inquirer');
const chalk = require('chalk');
const figlet = require('figlet');
const readline = require('readline');
const config = require('./config');

class Tui {
    constructor() {
        this.verbose = false;
    }

    clear() {
        // Ansi code for clearing screen
        this.write('\x1B[2J\x1B[0;0f');
    }

    header(text) {
        this.clear();
        this.write(
            `${chalk.yellow(
                figlet.textSync(text, { horizontalLayout: 'full' }),
            )}\n`,
        );
    }

    askWappstoCredentials(host) {
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
    }

    async askForNewWapp(wapps, present) {
        const choices = [{
            key: 'n',
            name: 'Create new Wapp',
            value: 'new',
        }];

        if (wapps) {
            choices.push({
                key: 'd',
                name: 'Download an existing Wapp',
                value: 'download',
            });
        }
        if (present) {
            this.showWarning('It seams like you already have a wapp in this folder!');
            const override = await Inquirer.prompt([{
                name: 'override',
                type: 'confirm',
                default: false,
                when: present,
                message: 'Do you want to delete your local wapp?',
            }]);
            if (!override.override) {
                choices.push({
                    key: 'g',
                    name: 'Generate a new Wapp from exsisting wapp',
                    value: 'generate',
                });
            }
        }

        const questions = [
            {
                message: 'How do you want to create the Wapp?',
                name: 'create',
                default: 'new',
                type: 'list',
                when: present || wapps.length !== 0,
                choices,
            },
            {
                name: 'wapp',
                type: 'list',
                when: (answer) => answer.create === 'download',
                message: 'Please choose the wapp to download:',
                choices: wapps,
            },
            {
                name: 'name',
                type: 'input',
                when: (answer) => answer.create === 'new' || answer.create === undefined,
                message: 'Please enter the name of your Wapp:',
                validate: (answer) => {
                    if (answer === '') {
                        return 'Name can\'t be empty';
                    }
                    return true;
                },
            },
            {
                name: 'author',
                type: 'input',
                when: (answer) => answer.create === 'new' || answer.create === undefined,
                message: 'Please enter the Author of your Wapp:',
            },
            {
                name: 'version',
                type: 'input',
                when: (answer) => answer.create === 'new' || answer.create === undefined,
                message: 'Please enter the Version of your Wapp:',
                default: '0.0.1',
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
                when: (answer) => answer.create === 'new' || answer.create === undefined,
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
                when: (answer) => answer.create === 'new' || answer.create === undefined,
                message: 'Please enter a general descrption about your Wapp:',
            },
            {
                name: 'foreground',
                type: 'input',
                message: 'Please enter a description about your foreground part of your Wapp:',
                when: (answer) => (answer.create === 'new' || answer.create === undefined) && answer.features.indexOf('foreground') !== -1,
            },
            {
                name: 'background',
                type: 'input',
                message: 'Please enter a description about your background part of your Wapp:',
                when: (answer) => (answer.create === 'new' || answer.create === undefined) && answer.features.indexOf('background') !== -1,
            },
            {
                name: 'examples',
                type: 'confirm',
                when: (answer) => answer.create === 'new' || answer.create === undefined,
                message: 'Generate example files for the Wapp?',
                default: false,
            },
        ];
        return Inquirer.prompt(questions);
    }

    async configureWapp() {
        const type = await Inquirer.prompt([
            {
                name: 'config',
                type: 'list',
                message: 'What do you want to configure?',
                choices: [
                    'ExtSync',
                    'OAuth',
                    new Inquirer.Separator(),
                    'Publish Wapp',
                ],
            }]);

        const extSyncQuestions = [{
            name: 'extsync',
            type: 'confirm',
            message: 'Should ExtSync be enabled for your Wapp?',
        }];

        const oauthQuestions = [{
            name: 'oauth',
            type: 'confirm',
            message: 'Do you want to delete the Wapp on Wappsto?',
        }];

        const publishQuestions = [{

        }];

        switch (type.config) {
        default:
        case 'ExtSync':
            return Inquirer.prompt(extSyncQuestions);
        case 'OAuth':
            return Inquirer.prompt(oauthQuestions);
        case 'Publish Wapp':
            return Inquirer.prompt(publishQuestions);
        }
    }

    deleteWapp() {
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
                when: (answer) => answer.del,
            },
            {
                name: 'remote',
                type: 'confirm',
                message: 'Do you want to delete the Wapp on Wappsto?',
                when: (answer) => answer.del,
            },
        ];
        return Inquirer.prompt(questions);
    }

    precisePermissionRequest(request) {
        let msg = '';
        let type = 'data';

        if (request.collection) {
            type = request.collection;
        }

        if (request.message) {
            msg = request.message;
        } else {
            msg = `${request.name_installation} would like to save ${type} under your account. Allow?`;
        }

        const questions = [
            {
                name: 'accept',
                type: 'confirm',
                message: msg,
            },
        ];
        return Inquirer.prompt(questions);
    }

    permissionRequest(request, data) {
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
    }

    remoteVersionUpdated() {
        const questions = [
            {
                name: 'local',
                type: 'confirm',
                default: true,
                message: 'Do you want to override local version information with remote information?',
            },
        ];
        return Inquirer.prompt(questions);
    }

    fileConflict(file) {
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
                    key: 'x',
                    name: 'Abort',
                    value: 'abort',
                }],
            },
        ];
        return Inquirer.prompt(questions);
    }

    askDeleteLocalFile(file) {
        const questions = [
            {
                name: 'delete',
                type: 'confirm',
                default: true,
                message: `${file} was deleted on the server, do you want to delete the local file?`,
            },
        ];
        return Inquirer.prompt(questions);
    }

    block() {
        this.blocked = [];
    }

    unblock() {
        const tmp = this.blocked;
        this.blocked = undefined;

        if (tmp) {
            tmp.forEach((item) => {
                /* istanbul ignore next */
                this.write(item);
            });
        }
    }

    showLog(msg, type, timestamp, logType = false) {
        let res = '';
        if (timestamp) {
            res = `${chalk.magenta(`${timestamp}:`)} `;
        }
        if (type) {
            if (type === 'Background') {
                res += chalk.green(type);
            } else {
                res += chalk.blue(type);
            }
            res += ' - ';
        }
        if (logType === 'error') {
            res += chalk.red(msg);
        } else if (logType === 'warn') {
            res += chalk.yellow(msg);
        } else {
            res += msg;
        }
        this.showMessage(res);
    }

    showVerbose(type, msg) {
        if (this.verbose) {
            readline.clearLine(process.stdout);
            readline.cursorTo(process.stdout, 0);
            this.write(`${chalk.yellow('I')} ${chalk.yellow(type)} - ${msg}\n`);
        }
    }

    showMessage(msg, str, end = '\n') {
        this.write(`${chalk.green('*')} ${chalk.whiteBright.bold(msg)}`);
        if (str) {
            this.write(str);
        }
        this.write(end);
    }

    showStatus(msg) {
        this.write(`${chalk.green('*')} ${chalk.green.bold(msg)}\n`);
    }

    showWarning(msg) {
        this.write(`${chalk.red('!')} ${chalk.yellow.bold(msg)}\n`);
    }

    showError(msg, err) {
        this.write(`\r${chalk.red('!')} ${chalk.red.bold(msg)}\n`);
        if (err) {
            if (err.response && err.response.data) {
                if (err.response.data.code === 300098) {
                    this.write(`${chalk.red(err.response.data.message)}\n`);
                    this.write(`Please visit ${config.host()}/pricing for more information\n`);
                } else {
                    this.write(`${JSON.stringify(err.response.data)}\n`);
                }
            } else if (err.stack) {
                // eslint-disable-next-line no-console
                console.error(err);
            } else if (typeof err === 'string') {
                this.write(`${err}\n`);
            } else {
                this.write(`${JSON.stringify(err)}\n`);
            }
        }
    }

    /* istanbul ignore next */
    write(msg) {
        if (this.blocked !== undefined) {
            this.blocked.push(msg);
            return;
        }

        process.stdout.write(msg);
    }
}

module.exports = new Tui();
