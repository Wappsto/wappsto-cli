const fs = require('fs');
const CLI = require('clui');

const { Progress } = CLI;
const { Spinner } = CLI;
const files = require('./files');
const tui = require('./tui');
const Wappsto = require('./wappsto');
const Config = require('./config');

module.exports = class Wapp {
    constructor() {
        this.wapp_files = ['.application', '.installation', 'manifest.json'];
        this.wapp_folders = [Config.foreground(), Config.background(), 'icon'];
        this.wapp_folders_create = ['icon'];
        this.wappsto = new Wappsto();
        this.application = files.loadJsonFile('.application');
        this.installation = files.loadJsonFile('.installation');
        this.manifest = files.loadJsonFile('manifest.json');
        this.block = undefined;
    }

    async init() {
        await this.wappsto.login();
    }

    async clean() {
        if (this.present()) {
            const override = await tui.overrideWapp();
            if (!override.override) {
                return false;
            }
            this.deleteLocal();
        }
        return true;
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
        let status = new Spinner('Loading Wapps, please wait...');
        status.start();

        await this.wappsto.loadApplications();

        status.stop();

        const wapps = this.wappsto.getApplications();
        if (wapps.length) {
            const oldWapps = await tui.loadOldWapp();
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
                const whatWapp = await tui.listWapps(listWapps);

                const id = whatWapp.wapp;
                const wapp = wapps.find(w => w.meta.id === id);

                await this.downloadWapp(wapp);
                return;
            }
        }

        const newWapp = await tui.askForNewWapp();

        status = new Spinner('Creating Wapp, please wait...');
        status.start();
        const data = await this.wappsto.createApplication(newWapp);
        if (data) {
            this.createFolders(newWapp.features, newWapp.examples);
            const installation = await this.wappsto.createInstallation(data.version[0].meta.id);
            Wapp.saveInstallation(installation);
            Wapp.saveApplication(data);
        }
        status.stop();

        if (data) {
            tui.showMessage(`Wapp created with id: ${data.meta.id}`);
        }
    }

    createFolders(folders, createExp) {
        const dirs = folders || this.wapp_folders;
        const exFiles = {
            foreground: ['main.js', 'index.html'],
            background: ['main.js', 'package.json'],
        };
        dirs.concat(this.wapp_folders_create).forEach((f) => {
            files.createFolders(`${f}/.`);
            if (createExp) {
                if (exFiles[f]) {
                    let exPath = `examples/${f}`;
                    if (files.fileExists('node_modules/wappsto-cli/examples/foreground/index.html')) {
                        exPath = `node_modules/wappsto-cli/examples/${f}`;
                    }
                    exFiles[f].forEach((file) => {
                        fs.copyFileSync(`${exPath}/${file}`, `${f}/${file}`);
                    });
                }
            }
        });
    }

    async downloadWapp(app) {
        const max = app.version[0].file.length;
        const status = new Progress(50);

        this.application = app;
        this.createFolders();

        if (max) {
            tui.showMessage(`Downloading Wapp ${app.version[0].name}: `, status.update(0, max), '\r');

            for (let i = 0; i < app.version[0].file.length; i += 1) {
                const file = app.version[0].file[i];
                const path = `${Wapp.getFilePath(file.use)}/${file.name}`;
                try {
                    // eslint-disable-next-line no-await-in-loop
                    await this.wappsto.downloadFile(`file/${file.meta.id}`, path);
                    const stats = fs.statSync(path);
                    file.meta.modified = stats.mtime;
                } catch (err) {
                    console.error('Failed to download path');
                }
                tui.showMessage(`Downloading Wapp ${app.version[0].name}: `, status.update(i + 1, max), '\r');
            }
            process.stdout.write('\n');
        } else {
            tui.showMessage(`Downloading Wapp ${app.version[0].name}: `, status.update(1, 1));
        }

        let installation = await this.getInstallation();
        if (installation === null) {
            installation = await this.wappsto.createInstallation(app.version[0].meta.id);
        }
        Wapp.saveApplication(app);
        Wapp.saveInstallation(installation);
    }

    static saveApplication(app) {
        const data = app;
        files.saveJsonFile('.application', data);

        delete data.version[0].session_user;
        delete data.version[0].native;
        delete data.version[0].application;
        delete data.version[0].uninstallable;
        delete data.version[0].object_requested;
        delete data.version[0].file;
        delete data.version[0].meta;
        files.saveJsonFile('manifest.json', data.version[0]);
    }

    static saveInstallation(installation) {
        files.saveJsonFile('.installation', installation);
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
        case 'png':
        case 'jpg':
        case 'jpeg':
        case 'gif':
        case 'svg':
            return `image/${ending}`;
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
        const type = file.split('/')[0];
        switch (type) {
        case Config.foreground():
            return 'foreground';
        case Config.background():
            return 'background';
        default:
            return type;
        }
    }

    static getFilePath(use) {
        switch (use) {
        case 'foreground':
            return Config.foreground();
        case 'background':
            return Config.background();
        default:
            return use;
        }
    }

    static compareVersions(oldVersion, newVersion) {
        const keys = Object.keys(oldVersion);
        for (let i = 0; i < keys.length; i += 1) {
            const key = keys[i];
            const obj1 = oldVersion[key];
            const obj2 = newVersion[key];
            if (typeof oldVersion[key] === 'string') {
                if (obj1 !== obj2) {
                    return true;
                }
            } else if (Array.isArray(oldVersion[key])) {
                if (obj1.length === obj2.length && obj1.every((u, index) => u === obj2[index])) {
                    return true;
                }
            } else if (Wapp.compareVersions(oldVersion[key], newVersion[key])) {
                return true;
            }
        }

        return false;
    }

    async update(reinstall) {
        if (!this.present()) {
            return [];
        }

        const results = [];
        let localFiles = [];
        const updateFiles = [];
        let upload = true;
        let overrideAll = false;
        let uploadAll = false;

        const localVersion = this.application.version[0];
        const versionID = localVersion.meta.id;

        const remoteVersion = await this.wappsto.getVersion(versionID);
        if (remoteVersion.meta.revision !== localVersion.revision
            && !Wapp.compareVersions(this.manifest, remoteVersion)) {
            const overide = await tui.remoteVersionUpdated();
            if (overide.local) {
                upload = false;
            }
        }
        if (upload) {
            await this.wappsto.updateVersion(localVersion.meta.id, this.manifest);
        }

        const status = new Spinner('Uploading Wapp to Wappsto, please wait...');
        status.start();

        // Find all files on disk
        this.wapp_folders.forEach((f) => {
            localFiles = localFiles.concat(files.getAllFiles(f, Wapp.validateFile));
        });

        // Get both remote and local files into a single array
        const cmp = (item, file) => (item.use === file.use || item.name === file.name);
        const allFiles = remoteVersion.file.concat(
            localVersion.file.filter(
                item => !remoteVersion.file.find(file => cmp(item, file)),
            ),
        );

        for (let i = 0; i < allFiles.length; i += 1) {
            const f = allFiles[i];
            let remoteUpdated = false;
            let locallyUpdated = false;
            let fileTime = null;
            const path = `${Wapp.getFilePath(f.use)}/${f.name}`;

            const rf = remoteVersion.file.find(file => path === `${Wapp.getFilePath(file.use)}/${file.name}`);
            const lf = localVersion.file.find(file => path === `${Wapp.getFilePath(file.use)}/${file.name}`);

            localFiles.splice(localFiles.indexOf(path), 1);

            if (files.fileExists(path)) {
                fileTime = fs.statSync(path).mtime.toISOString();
            }

            if (lf && rf) {
                if (rf.meta.updated !== lf.meta.updated) {
                    remoteUpdated = true;
                }
                if (fileTime && lf.meta.modified !== fileTime) {
                    locallyUpdated = true;
                }
            }

            if (overrideAll) {
                locallyUpdated = false;
            } else if (uploadAll) {
                remoteUpdated = false;
            }

            if (remoteUpdated && locallyUpdated) {
                status.stop();
                let run = true;
                while (run) {
                    run = false;
                    // eslint-disable-next-line no-await-in-loop
                    const answer = await tui.fileConflict(path);
                    switch (answer.conflict) {
                    case 'override_all':
                        overrideAll = true;
                        // eslint-disable-next-line no-fallthrough
                    case 'overwrite':
                        locallyUpdated = false;
                        break;
                    case 'upload_all':
                        uploadAll = true;
                        // eslint-disable-next-line no-fallthrough
                    case 'upload':
                        remoteUpdated = false;
                        break;
                    case 'diff':
                        run = true;
                        break;
                    case 'abort':
                        return [];
                    default:
                    }
                }
                status.start();
            }

            if ((rf && !lf) || (remoteUpdated && !locallyUpdated)) {
                try {
                    // eslint-disable-next-line no-await-in-loop
                    await this.wappsto.downloadFile(`file/${f.meta.id}`, path);
                    updateFiles.push({ name: path, status: 'downloaded' });
                } catch (err) {
                    updateFiles.push({ name: path, status: 'not downloaded' });
                }
            } else if ((!remoteUpdated && locallyUpdated)) {
                updateFiles.push({ name: path, status: 'updated' });
                results.push(this.wappsto.updateFile(versionID, f.meta.id, path));
            } else if (lf && !fileTime) {
                updateFiles.push({ name: path, status: 'deleted' });
                if (rf) {
                    results.push(this.wappsto.deleteFile(f.meta.id));
                }
            } else if (!rf && lf && !locallyUpdated) {
                status.stop();
                // eslint-disable-next-line no-await-in-loop
                const answer = await tui.askDeleteLocalFile(path);
                status.start();
                if (answer.delete) {
                    updateFiles.push({ name: path, status: 'deleted' });
                    files.deleteFile(path);
                }
            }
        }

        localFiles.forEach(async (f) => {
            updateFiles.push({ name: f, status: 'created' });

            const file = {
                type: Wapp.getFileType(f),
                name: Wapp.getFileName(f),
                use: Wapp.getFileUse(f),
            };
            // eslint-disable-next-line no-await-in-loop
            await this.wappsto.createFile(versionID, file, f);
        });

        let installation = await this.getInstallation();
        if (installation === null) {
            installation = await this.wappsto.createInstallation(versionID);
            Wapp.saveInstallation(installation);
        }
        if (reinstall) {
            results.push(this.wappsto.restartInstallation(installation.meta.id, true, true));
        } else {
            results.push(this.wappsto.restartInstallation(installation.meta.id));
        }

        await Promise.all(results);

        await new Promise(async (resolve) => {
            setTimeout(async () => {
                const newApp = await this.wappsto.loadApplication(this.application.meta.id);
                if (newApp.version && newApp.version[0] && newApp.version[0].file) {
                    for (let i = 0; i < newApp.version[0].file.length; i += 1) {
                        const f = newApp.version[0].file[i];
                        const path = `${Wapp.getFilePath(f.use)}/${f.name}`;
                        if (files.fileExists(path)) {
                            const stats = fs.statSync(path);
                            f.meta.modified = stats.mtime;
                        }
                    }
                }

                Wapp.saveApplication(newApp);

                resolve();
            }, 500);
        });

        status.stop();

        return updateFiles;
    }

    async delete() {
        if (!this.present()) {
            return;
        }

        const answer = await tui.deleteWapp();

        if (answer.del) {
            const status = new Spinner('Deleting Wapp, please wait...');
            status.start();

            if (answer.local) {
                this.deleteLocal();
            }
            if (answer.remote) {
                const results = [];
                this.application.version.forEach((v) => {
                    if (v.meta && v.meta.id) {
                        results.push(this.wappsto.deleteVersion(v.meta.id));
                        results.push(this.wappsto.deleteInstallation(v.meta.id));
                    }
                });

                if (this.application.meta && this.application.meta.id) {
                    results.push(this.wappsto.deleteApplication(this.application.meta.id));
                }
                await Promise.all(results);
            }

            status.stop();
            if (answer.local || answer.remote) {
                tui.showMessage('Wapp deleted');
            } else {
                tui.showWarning('Nothing deleted');
            }
        }
    }

    async getInstallation(name) {
        let installation;
        if (name) {
            installation = await this.wappsto.getInstallation(undefined, name);
        } else {
            const versionID = this.application.version[0].meta.id;
            installation = await this.wappsto.getInstallation(versionID);
        }
        return installation;
    }

    async getInstallationSession() {
        const installation = await this.getInstallation();
        this.installation = installation;
        this.installation_session = installation.session;
        if (this.sessionCallback) {
            this.sessionCallback(installation.session);
        }
        return installation.session;
    }

    async getWappCreatorSession() {
        const installation = await this.getInstallation('Wapp Creator');
        this.installation_session = installation.session;
        return installation.session;
    }

    async handleStreamEvent(data) {
        if (Object.prototype.hasOwnProperty.call(data, 'application')
            && data.application !== this.application.meta.id) {
            return;
        }

        if (Object.prototype.hasOwnProperty.call(data, 'installation')
            && data.installation !== this.installation.meta.id) {
            return;
        }

        if (this.block !== undefined) {
            this.block.push(data);
            return;
        }

        const block = () => {
            this.block = [];
        };
        const unblock = () => {
            const tmp = this.block;
            this.block = undefined;

            if (tmp) {
                tmp.forEach((item) => {
                    this.handleStreamEvent(item);
                });
            }
        };

        if (data.reinstall) {
            block();
            await this.getInstallationSession();
            const tmp = this.lightStream;
            this.lightStream = undefined;
            await this.openStream();
            setTimeout(tmp.close.bind(tmp), 2000);
            tui.showStatus(data.log);
            unblock();
        } else if (data.log) {
            tui.showMessage(data.log);
        } else if (data.error) {
            tui.showError(data.error);
        } else if (data.status) {
            tui.showStatus(data.status);
            if (data.session) {
                await this.getInstallationSession();
            }
        } else if (data.req) {
            block();
            const opts = [];
            const search = [];
            if (data.req.limitation) {
                Object.keys(data.req.limitation).forEach((key) => {
                    const lim = data.req.limitation[key];
                    Object.keys(lim).forEach((type) => {
                        search.push(`this_${type}=[${lim[type].join(',')}]`);
                    });
                });
                const items = await this.wappsto.find(data.req.type, search.join('&'), data.req.method, data.req.quantity, this.installation.meta.id);
                if (items.length) {
                    items.forEach((item) => {
                        opts.push({
                            name: item.name,
                            value: item.meta.id,
                        });
                    });
                    const answers = await tui.permissionRequest(data.req, opts);

                    const results = [];
                    answers.permission.forEach((per) => {
                        // eslint-disable-next-line max-len
                        results.push(this.wappsto.updateACL(per, data.installation, [], data.req.method));
                    });
                    let status = 'read';
                    if (answers.permission.length) {
                        status = 'accepted';
                    }
                    results.push(this.wappsto.readNotification(data.id, status));

                    await Promise.all(results);
                } else {
                    tui.showWarning(`Failed to find anything matching the permission request from ${data.req.name_installation}`);
                }
            } else if (data.req.collection) {
                const answers = await tui.precisePermissionRequest(data.req);
                if (answers.accept) {
                    if (data.req.method[0] === 'add') {
                        const methods = {
                            create: true,
                            update: true,
                            retrieve: true,
                            delete: false,
                        };
                        await this.wappsto.updateACLRestriction(data.installation, 'create', data.req.collection, methods);
                    } else {
                        tui.showWarning(`Unknown '${data.req.method[0]}' permission request`);
                    }
                    await this.wappsto.readNotification(data.id, 'accepted');
                } else {
                    await this.wappsto.readNotification(data.id, 'denied');
                }
            } else {
                console.error('Failed to handle request', data.req);
            }
            unblock();
        } else if (typeof data !== 'string') {
            tui.showMessage(JSON.stringify(data));
        } else {
            tui.showMessage(data);
        }
    }

    async openStream(sessionCallback) {
        let appStream;
        let lightStream;

        if (sessionCallback) {
            this.sessionCallback = sessionCallback;
        }

        let streams = await this.wappsto.getStreams();
        for (let i = 0; i < streams.length; i += 1) {
            if (!appStream && streams[i].subscription.length === 2
                && streams[i].subscription.indexOf('/notification') !== -1
                && streams[i].subscription.indexOf('/installation') !== -1) {
                appStream = streams[i].meta.id;
                break;
            }
        }

        streams = await this.wappsto.getStreams(this.installation_session);
        for (let i = 0; i < streams.length; i += 1) {
            if (streams[i].subscription.indexOf('/extsync') !== -1) { //! light_stream &&
                lightStream = streams[i].meta.id;
                // break;
            }
        }

        if (!appStream) {
            tui.showMessage('Creating new stream for notifications');
            const newStream = await this.wappsto.createStream(['/notification', '/installation']);
            appStream = newStream.meta.id;
        }

        if (!lightStream) {
            tui.showMessage('Creating new stream for background');
            const newStream = await this.wappsto.createStream(['/extsync'], this.installation_session);
            lightStream = newStream.meta.id;
        }

        if (!this.appStream) {
            this.appStream = this.wappsto.openStream('app.', appStream, this.handleStreamEvent.bind(this));
        }
        if (!this.lightStream) {
            this.lightStream = this.wappsto.openStream('light.', lightStream, this.handleStreamEvent.bind(this), this.installation_session);
        }
    }

    async handlePermissionRequest(request) {
        const response = await this.wappsto.search(request.type, request.limitations);
        return response;
    }
};
