const fs = require('fs');
const CLI = require('clui');

const { Progress } = CLI;
const { Spinner } = CLI;
const files = require('./files');
const inquirer = require('./inquirer');
const Wappsto = require('./wappsto');


module.exports = class Wapp {
    constructor() {
        this.wapp_files = ['.application', 'manifest.json'];
        this.wapp_folders = ['foreground', 'background', 'icon'];
        this.wappsto = new Wappsto();
        this.application = files.loadJsonFile('.application');
        this.manifest = files.loadJsonFile('manifest.json');
    }

    async init() {
        await this.wappsto.login();
    }

    async clean() {
        let oldWapp = false;
        this.wapp_files.forEach((f) => {
            oldWapp = oldWapp || files.fileExists(f);
        });
        this.wapp_folders.forEach((d) => {
            oldWapp = oldWapp || files.directoryExists(d);
        });

        if (oldWapp) {
            const override = await inquirer.overrideWapp();
            if (!override.override) {
                process.exit(-1);
            }

            this.wapp_files.forEach((f) => {
                files.deleteFile(f);
            });
            this.wapp_folders.forEach((f) => {
                files.deleteFolder(f);
            });
        }
    }

    async create() {
        await this.wappsto.loadWapps();

        const wapps = this.wappsto.getApplications();
        if (wapps.length) {
            const oldWapps = await inquirer.loadOldWapp();
            if (oldWapps.load) {
                const listWapps = [];
                wapps.forEach((w) => {
                    const { name } = w.version[0];
                    const { id } = w.meta;
                    listWapps.push({
                        name: `${name} (${id})`,
                        value: id,
                    });
                });
                const whatWapp = await inquirer.listWapps(listWapps);

                const id = whatWapp.wapp;
                const wapp = wapps.find(w => w.meta.id === id);

                await this.downloadWapp(wapp);
                return;
            }
        }

        const newWapp = await inquirer.askForNewWapp();
        const data = await this.wappsto.createApplication(newWapp.name, newWapp.features);
        if (data) {
            this.createFolders(newWapp.features);
            Wapp.saveApplication(data);
            inquirer.showMessage(`Wapp created with id: ${data.meta.id}`);
        }
    }

    createFolders() {
        this.wapp_folders.forEach((f) => {
            files.createFolders(`${f}/.`);
        });
    }

    async downloadWapp(app) {
        const max = app.version[0].file.length;
        const status = new Progress(50);

        this.createFolders();

        if (max) {
            inquirer.showMessage(`Downloading Wapp ${app.version[0].name}: `, status.update(0, max), '\r');

            for (let i = 0; i < app.version[0].file.length; i += 1) {
                const file = app.version[0].file[i];
                const path = `${file.use}/${file.name}`;
                try {
                    // eslint-disable-next-line no-await-in-loop
                    await this.wappsto.downloadFile(`file/${file.meta.id}`, path);
                    const stats = fs.statSync(path);
                    file.meta.modified = stats.mtime;
                } catch (err) {

                }
                inquirer.showMessage(`Downloading Wapp ${app.version[0].name}: `, status.update(i + 1, max), '\r');
            }
            process.stdout.write('\n');
        } else {
            inquirer.showMessage(`Downloading Wapp ${app.version[0].name}: `, status.update(1, 1));
        }

        Wapp.saveApplication(app);
    }

    static saveApplication(app) {
        const data = app;
        fs.writeFileSync('.application', JSON.stringify(data, null, 4));

        delete data.version[0].session_user;
        delete data.version[0].native;
        delete data.version[0].application;
        delete data.version[0].uninstallable;
        delete data.version[0].object_requested;
        delete data.version[0].file;
        fs.writeFileSync('manifest.json', JSON.stringify(data.version[0], null, 4));
    }

    static validateFile(file) {
        const ending = file.split('.').slice(-1)[0];
        console.log(file, ending);
        if (['html', 'css', 'js', 'json', 'png', 'jpg', 'jpeg'].indexOf(ending) !== -1) {
            return true;
        }

        return false;
    }

    static getFileType(file) {
        const ending = file.split('.').slice(-1)[0];
        switch (ending) {
        case 'js':
            return 'application/javascript';
        case 'json':
            return 'application/json';
        default:
            return `text/${ending}`;
        }
    }

    static getFileName(file) {
        const tmp = file.split('/');
        tmp.shift();
        return tmp.join('/');
    }

    static getFileUse(file) {
        return file.split('/')[0];
    }

    async upload() {
        const versionID = this.application.version[0].meta.id;
        const status = new Spinner('Uploading Wapp to Wappsto, please wait...');
        status.start();

        let allFiles = [];
        const updateFiles = [];

        this.wapp_folders.forEach((f) => {
            allFiles = allFiles.concat(files.getAllFiles(f, Wapp.validateFile));
        });

        console.log('all', allFiles);

        await this.wappsto.updateVersion(this.manifest);

        const results = [];
        this.application.version[0].file.forEach((f, index) => {
            const path = `${f.use}/${f.name}`;
            allFiles.splice(allFiles.indexOf(path), 1);
            if (files.fileExists(path)) {
                const stats = fs.statSync(path);
                if (f.meta.modified !== stats.mtime.toISOString()) {
                    const data = files.loadFile(path);
                    results.push(this.wappsto.updateFile(versionID, f.meta.id, data));
                    this.application.version[0].file[index].meta.modified = stats.mtime;
                }
            } else {
                results.push(this.wappsto.deleteFile(f.meta.id));
            }
        });

        console.log(allFiles);

        allFiles.forEach((f) => {
            const data = files.loadFile(f);

            const file = {
                type: Wapp.getFileType(f),
                name: Wapp.getFileName(f),
                use: Wapp.getFileUse(f),
            };
            results.push(this.wappsto.createFile(versionID, file, data));
        });

        await Promise.all(results);

        Wapp.saveApplication(this.application);

        status.stop();

        return updateFiles;
    }

    async delete() {
        const answer = await inquirer.deleteWapp();
        console.log(answer);
        console.log("Delete wapp");
    }
};
