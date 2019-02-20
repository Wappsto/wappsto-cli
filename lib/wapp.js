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
        this.wapp_folders_create = ['icon'];
        this.wappsto = new Wappsto();
        this.application = files.loadJsonFile('.application');
        this.manifest = files.loadJsonFile('manifest.json');
    }

    async init() {
        await this.wappsto.login();
    }

    async clean() {
        if (this.present()) {
            const override = await inquirer.overrideWapp();
            if (!override.override) {
                process.exit(-1);
            }
            this.deleteLocal();
        }
    }

    present() {
        let oldWapp = false;
        this.wapp_files.forEach((f) => {
            oldWapp = oldWapp || files.fileExists(f);
        });
        this.wapp_folders.forEach((d) => {
            oldWapp = oldWapp || files.directoryExists(d);
        });
        return oldWapp;
    }

    deleteLocal() {
        this.wapp_files.forEach((f) => {
            files.deleteFile(f);
        });
        this.wapp_folders.forEach((f) => {
            files.deleteFolder(f);
        });
    }

    async create() {
        const status = new Spinner('Loading Wapps, please wait...');
        status.start();

        await this.wappsto.loadApplications();

        status.stop();

        const wapps = this.wappsto.getApplications();
        if (wapps.length) {
            const oldWapps = await inquirer.loadOldWapp();
            if (oldWapps.load) {
                const listWapps = [];
                wapps.forEach((w) => {
                    if (w.version && w.version[0]) {
                        const { name } = w.version[0];
                        const { id } = w.meta;
                        listWapps.push({
                            name: `${name} (${id})`,
                            value: id,
                        });
                    }
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
            this.createFolders(newWapp.features, newWapp.examples);
            Wapp.saveApplication(data);
            inquirer.showMessage(`Wapp created with id: ${data.meta.id}`);
        }
    }

    createFolders(folders, examples) {
        const dirs = folders || this.wapp_folders;
        dirs.concat(this.wapp_folders_create).forEach((f) => {
            files.createFolders(`${f}/.`);
            if (examples) {
                switch (f) {
                case 'foreground':
                    fs.copyFileSync('examples/foreground/index.html', 'foreground/index.html');
                    fs.copyFileSync('examples/foreground/main.js', 'foreground/main.js');
                    break;
                case 'background':
                    fs.copyFileSync('examples/background/package.json', 'background/package.json');
                    fs.copyFileSync('examples/background/main.js', 'background/main.js');
                    break;
                default:
                    break;
                }
            }
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
                    console.error('Failed to download path');
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
        if (['html', 'svg', 'yaml', 'yml', 'css', 'js', 'json', 'gif', 'png', 'jpg', 'jpeg'].indexOf(ending) !== -1) {
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

    async update() {
        const versionID = this.application.version[0].meta.id;
        const status = new Spinner('Uploading Wapp to Wappsto, please wait...');
        status.start();

        let allFiles = [];
        const updateFiles = [];

        this.wapp_folders.forEach((f) => {
            allFiles = allFiles.concat(files.getAllFiles(f, Wapp.validateFile));
        });

        await this.wappsto.updateVersion(this.manifest);

        const results = [];
        this.application.version[0].file.forEach((f, index) => {
            const path = `${f.use}/${f.name}`;
            allFiles.splice(allFiles.indexOf(path), 1);
            if (files.fileExists(path)) {
                const stats = fs.statSync(path);
                if (f.meta.modified !== stats.mtime.toISOString()) {
                    updateFiles.push({ name: path, status: 'updated' });
                    const data = files.loadFile(path);
                    results.push(this.wappsto.updateFile(versionID, f.meta.id, data));
                    this.application.version[0].file[index].meta.modified = stats.mtime;
                }
            } else {
                updateFiles.push({ name: path, status: 'deleted' });
                results.push(this.wappsto.deleteFile(f.meta.id));
            }
        });

        allFiles.forEach((f) => {
            updateFiles.push({ name: f, status: 'created' });
            const data = files.loadFile(f);

            const file = {
                type: Wapp.getFileType(f),
                name: Wapp.getFileName(f),
                use: Wapp.getFileUse(f),
            };
            results.push(this.wappsto.createFile(versionID, file, data));
        });

        await Promise.all(results);

        const newApp = await this.wappsto.loadApplication(this.application.meta.id);

        for (let i = 0; i < newApp.version[0].file.length; i += 1) {
            const f = newApp.version[0].file[i];
            const path = `${f.use}/${f.name}`;
            if (!files.fileExists(path)) {
                try {
                    // eslint-disable-next-line no-await-in-loop
                    await this.wappsto.downloadFile(`file/${f.meta.id}`, path);
                    updateFiles.push({ name: f.name, status: 'downloaded' });
                } catch (err) {
                    updateFiles.push({ name: f, status: 'not downloaded' });
                }
            }
            const stats = fs.statSync(path);
            f.meta.modified = stats.mtime;
        }

        Wapp.saveApplication(newApp);

        status.stop();

        return updateFiles;
    }

    async delete() {
        const answer = await inquirer.deleteWapp();

        if (answer.del) {
            const status = new Spinner('Deleting Wapp, please wait...');
            status.start();

            if (answer.local) {
                this.deleteLocal();
            }
            if (answer.remote) {
                const results = [];
                this.application.version.forEach((v) => {
                    results.push(this.wappsto.deleteVersion(v.meta.id));
                    results.push(this.wappsto.deleteInstallation(v.meta.id));
                });
                results.push(this.wappsto.deleteApplication(this.application.meta.id));
                await Promise.all(results);
            }

            status.stop();
            if (answer.local || answer.remote) {
                inquirer.showMessage('Wapp deleted');
            } else {
                inquirer.showWarning('Nothing deleted');
            }
        }
    }
};
