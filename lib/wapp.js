const fs = require('fs');
const { Mutex } = require('async-mutex');
const Stream = require('./stream');
const Installation = require('./installation');
const Application = require('./application');
const Spinner = require('./spinner');
const files = require('./files');
const tui = require('./tui');
const Wappsto = require('./wappsto');
const Config = require('./config');
const Util = require('./util');

module.exports = class Wapp {
    constructor(verbose = false) {
        tui.verbose = verbose;
        this.mutex = new Mutex();
        this.cacheFolder = Config.cacheFolder();
        this.initCacheFolder();
        this.wapp_files = [
            `${this.cacheFolder}/application`,
            `${this.cacheFolder}/installation`,
            'manifest.json',
        ];
        this.ignoreFolders = [
            'node_modules',
            '.node_modules',
        ];
        this.wapp_folders = [Config.foreground(), Config.background(), 'icon'];
        this.wapp_folders_create = ['icon'];
        this.wappsto = new Wappsto();
        this.application = new Application(files.loadJsonFile(`${this.cacheFolder}/application`));
        this.installation = new Installation();
        this.stream = new Stream(this.wappsto);
        this.manifest = files.loadJsonFile('manifest.json');
        this.block = undefined;
    }

    get host() {
        return this.wappsto.HOST;
    }

    get versionID() {
        return this.application.getVersion().id;
    }

    async init() {
        await this.wappsto.login();
    }

    initCacheFolder() {
        if (!fs.existsSync(this.cacheFolder)) {
            fs.mkdirSync(this.cacheFolder);
        }
        ['application', 'installation', 'session'].forEach((e) => {
            const f = `.${e}`;
            if (fs.existsSync(f)) {
                fs.renameSync(f, `${this.cacheFolder}/${e}`);
            }
        });
    }

    present() {
        let oldWapp = false;
        this.wapp_files.forEach((f) => {
            oldWapp = oldWapp || files.fileExists(f);
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

    async create(validate) {
        const listWapps = [];
        let updateFiles;
        const status = new Spinner('Loading Wapps, please wait...');
        status.start();

        const wapps = await this.application.getAll();
        if (wapps.length) {
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
        }

        status.stop();

        const newWapp = await tui.askForNewWapp(listWapps, this.present());

        let data;
        switch (newWapp.create) {
        case 'download':
            this.deleteLocal();
            await this.downloadWapp(wapps.find((w) => w.meta.id === newWapp.wapp));
            break;
        case 'generate':
            status.setMessage('Creating Wapp, please wait...');
            status.start();

            if (this.manifest.meta) {
                this.manifest = Wapp.saveManifest(this.manifest);
            }

            this.application = await this.application.create(this.manifest);
            if (!this.application) {
                /* istanbul ignore next */
                status.stop();
                /* istanbul ignore next */
                throw new Error('Failed to generate Application');
            }

            await this.installation.create(this.versionID);
            this.manifest = Wapp.saveApplication(this.application);
            status.stop();

            this.createFolders(this.manifest.suported_features, false, {
                foreground: Config.foreground(),
                background: Config.background(),
            });

            updateFiles = await this.update();
            updateFiles.forEach(async (f) => {
                if (validate) {
                    await this.wappsto.downloadFile(`file/${f.id}`, `${this.cacheFolder}/file/${f.name}`);
                    const localBuff = Buffer.from(files.loadFile(f.name));
                    const remoteBuff = Buffer.from(files.loadFile(`${this.cacheFolder}/file/${f.name}`));

                    if (localBuff.compare(remoteBuff) !== 0) {
                        tui.showError(`${f.name} was not uploaded correctly`);
                        return;
                    }
                }
                tui.showMessage(`${f.name} was ${f.status}`);
            });

            if (this.application && this.installation.data) {
                tui.showMessage(`Wapp created with id: ${this.application.id}`);
            }
            break;
        default:
            status.setMessage('Creating Wapp, please wait...');
            status.start();

            this.application = await this.application.create(newWapp);
            if (this.application) {
                const customFolders = {
                    foreground: Config.foreground(),
                    background: Config.background(),
                };
                this.createFolders(newWapp.features, newWapp.examples, customFolders);
                await this.installation.create(this.application.data.version[0].meta.id);
                Wapp.saveApplication(this.application);
            }
            status.stop();

            if (data) {
                tui.showMessage(`Wapp created with id: ${data.meta.id}`);
            }
            break;
        }
    }

    createFolders(folders, createExamples, folderMapping = {}) {
        const dirs = folders || this.wapp_folders;
        const exampleFiles = {
            foreground: ['main.js', 'index.html'],
            background: ['main.js', 'package.json'],
        };

        dirs.concat(this.wapp_folders_create).forEach((f) => {
            const path = folderMapping[f] || f;
            files.createFolders(`${path}/.`);
            if (createExamples && exampleFiles[f]) {
                const exPath = `${__dirname}/../examples/${f}`;
                exampleFiles[f].forEach((file) => {
                    fs.copyFileSync(`${exPath}/${file}`, `${path}/${file}`);
                });
            }
        });
    }

    async downloadWapp(app) {
        const status = new Spinner(`Downloading Wapp ${app.version[0].name}`);
        status.start();

        this.application = new Application(app);
        this.createFolders();

        for (let i = 0; i < app.version[0].file.length; i += 1) {
            const file = app.version[0].file[i];
            const filePath = `${Util.getFilePath(file.use)}/${file.name}`;
            try {
                status.setMessage(`Downloading ${filePath}, please wait...`);
                // eslint-disable-next-line no-await-in-loop
                await this.wappsto.downloadFile(`file/${file.meta.id}`, filePath);
                const stats = fs.statSync(filePath);
                file.meta.modified = stats.mtime;
            } catch (err) {
                /* istanbul ignore next */
                files.deleteFile(filePath);
            }
        }

        status.setMessage('Downloading installation, please wait...');
        await this.installation.load(app.version[0].meta.id);
        Wapp.saveApplication(this.application);

        status.stop();
        tui.showMessage(`Downloaded Wapp ${app.version[0].name}`);
    }

    static saveApplication(app) {
        let data = app;

        if (app.data) {
            app.save();
            data = app.data;
        } else {
            files.saveJsonFile(`${Config.cacheFolder()}/application`, data);
        }
        return Wapp.saveManifest(data.version[0]);
    }

    static saveManifest(version) {
        const newVersion = JSON.parse(JSON.stringify(version));
        delete newVersion.session_user;
        delete newVersion.native;
        delete newVersion.application;
        delete newVersion.uninstallable;
        delete newVersion.object_requested;
        delete newVersion.file;
        delete newVersion.meta;
        delete newVersion.owner;
        delete newVersion.name_folder;
        files.saveJsonFile('manifest.json', newVersion);
        return newVersion;
    }

    async uploadFile(filePath) {
        const localVersion = this.application.getVersion();
        const localFile = localVersion.findFile(filePath);

        if (localFile) {
            const newFile = await this.wappsto.updateFile(
                this.versionID, localFile.meta.id, filePath,
            );
            localVersion.updateFile(filePath, newFile);

            await this.installation.restart();

            tui.showMessage(`${filePath} was updated`);
        } else {
            tui.showVerbose('WAPP', `${filePath} was changed but is not part of the version`);
        }
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

        const localVersion = this.application.getVersion();

        const status = new Spinner('Updating Wapp, please wait...');
        status.start();

        status.setMessage('Downloading version, please wait...');
        const remoteVersion = await localVersion.get();

        if (remoteVersion
            && remoteVersion.revision !== localVersion.revision
            && !Util.compareVersions(this.manifest, remoteVersion.data)) {
            status.stop();
            const overide = await tui.remoteVersionUpdated();
            status.start();
            if (overide.local) {
                upload = false;
            }
        }
        if (upload) {
            status.setMessage('Updating version, please wait...');
            if (!await this.application.getVersion().update(this.manifest)) {
                status.stop();
                return [];
            }
        }

        // Find all files on disk
        this.wapp_folders.forEach((f) => {
            localFiles = localFiles.concat(
                files.getAllFiles(f, Util.validateFile, this.ignoreFolders),
            );
        });

        // Get both remote and local files into a single array
        const cmp = (item, file) => (item.use === file.use && item.name === file.name);
        const allFiles = !remoteVersion ? localVersion.file : remoteVersion.file.concat(
            localVersion.file.filter(
                (item) => !remoteVersion.file.find((file) => cmp(item, file)),
            ),
        );

        allFiles.forEach(async (f) => {
            if (!f) {
                return;
            }
            let remoteUpdated = false;
            let locallyUpdated = false;
            let fileTime = null;
            const filePath = `${Util.getFilePath(f.use)}/${f.name}`;

            const rf = !remoteVersion ? null : remoteVersion.findFile(filePath);
            const lf = localVersion.findFile(filePath);

            const localIndex = localFiles.indexOf(filePath);
            if (localIndex !== -1) {
                localFiles.splice(localFiles.indexOf(filePath), 1);
            }

            if (files.fileExists(filePath)) {
                fileTime = fs.statSync(filePath).mtime.toISOString();
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
                tui.block();
                let run = true;
                while (run) {
                    run = false;
                    // eslint-disable-next-line no-await-in-loop
                    const answer = await tui.fileConflict(filePath);
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
                    case 'abort':
                        process.exit();
                        break;
                    default:
                    }
                }
                tui.unblock();
                status.start();
            }

            const fileStatus = { id: f.meta.id, name: filePath };
            if ((rf && !lf) || (remoteUpdated && !locallyUpdated)) {
                try {
                    status.setMessage(`Downloading ${filePath}, please wait...`);
                    // eslint-disable-next-line no-await-in-loop
                    await this.wappsto.downloadFile(`file/${f.meta.id}`, filePath);
                    fileStatus.status = 'downloaded';
                } catch (err) {
                    fileStatus.status = 'not downloaded';
                }
            } else if ((!remoteUpdated && locallyUpdated)) {
                status.setMessage(`Uploading ${filePath}, please wait...`);
                fileStatus.status = 'updated';
                results.push(this.wappsto.updateFile(this.versionID, f.meta.id, filePath));
            } else if (lf && !fileTime) {
                fileStatus.status = 'deleted';
                if (rf) {
                    status.setMessage(`Deleting ${filePath}, please wait...`);
                    results.push(this.wappsto.deleteFile(f.meta.id));
                }
            } else if (!rf && lf && !locallyUpdated) {
                status.stop();
                // eslint-disable-next-line no-await-in-loop
                const answer = await tui.askDeleteLocalFile(filePath);
                status.start();
                if (answer.delete) {
                    fileStatus.status = 'deleted';
                    files.deleteFile(filePath);
                }
            }
            if (fileStatus.status) {
                updateFiles.push(fileStatus);
            }
        });

        localFiles.forEach(async (f) => {
            status.setMessage(`Creating ${f}, please wait...`);

            const file = {
                type: Util.getFileType(f),
                name: Util.getFileName(f),
                use: Util.getFileUse(f),
            };

            // eslint-disable-next-line no-await-in-loop
            const newFile = await this.wappsto.createFile(this.versionID, file, f);
            updateFiles.push({ id: newFile.meta.id, name: f, status: 'created' });
        });

        status.setMessage('Loading version, please wait...');
        await this.installation.load(this.versionID);

        if (reinstall) {
            results.push(this.installation.restart(true, true));
        } else {
            results.push(this.installation.restart());
        }

        await Promise.all(results);
        status.setMessage('Loading application, please wait...');

        await new Promise((resolve) => {
            setTimeout(async () => {
                try {
                    const newApp = await this.application.get();
                    if (newApp) {
                        if (newApp.version && newApp.version[0] && newApp.version[0].file) {
                            for (let i = 0; i < newApp.version[0].file.length; i += 1) {
                                const f = newApp.version[0].file[i];
                                const filePath = `${Util.getFilePath(f.use)}/${f.name}`;
                                if (files.fileExists(filePath)) {
                                    const stats = fs.statSync(filePath);
                                    f.meta.modified = stats.mtime;
                                }
                            }
                        }
                        Wapp.saveApplication(newApp);
                    }
                    resolve();
                } catch (err) {
                    /* istanbul ignore next */
                    resolve();
                }
            }, 500);
        });

        status.stop();

        return updateFiles;
    }

    async configure() {
        if (!this.present()) {
            return;
        }

        const answer = await tui.configureWapp();
        if (Object.prototype.hasOwnProperty.call(answer, 'extsync')) {
            this.installation.setExtSync(answer.extsync);
        }
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
                    if (v.id) {
                        results.push(v.delete());
                        results.push(this.installation.delete(v.id));
                    }
                });

                if (this.application.id) {
                    results.push(this.application.delete());
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

    async getInstallationSession() {
        await this.installation.load(this.versionID);
        if (this.sessionCallback) {
            this.sessionCallback(this.installation.session);
        }
        return this.installation.session;
    }

    async handleStreamEvent(data) {
        if (Object.prototype.hasOwnProperty.call(data, 'application')
            && data.application !== this.application.id) {
            return;
        }

        if (Object.prototype.hasOwnProperty.call(data, 'installation')
            && data.installation !== this.installation.id) {
            return;
        }

        if (data.reinstall) {
            const oldSession = this.installation.session;
            const newSession = await this.getInstallationSession();
            if (oldSession !== newSession) {
                const tmp = this.lightStream;
                this.lightStream = undefined;
                await this.openStream();
                setTimeout(tmp.close.bind(tmp), 2000);
            }
            if (data.log) {
                tui.showStatus(data.log);
            }
        } else if (data.log) {
            tui.showLog(data.log, data.type, data.timestamp);
        } else if (data.error) {
            if (data.type === 'Background') {
                tui.showLog(data.error, data.type, data.timestamp, 'error');
            } else {
                tui.showError(data.error);
            }
        } else if (data.warn) {
            if (data.type === 'Background') {
                tui.showLog(data.warn, data.type, data.timestamp, 'warn');
            } else {
                tui.showWarning(data.warn);
            }
        } else if (Object.prototype.hasOwnProperty.call(data, 'status')) {
            if (data.status) {
                tui.showStatus(data.status);
                if (data.session) {
                    await this.getInstallationSession();
                }
            }
        } else if (data.req) {
            await this.mutex.runExclusive(async () => {
                tui.block();
                const opts = [];
                const search = [];
                if (data.req.limitation) {
                    Object.keys(data.req.limitation).forEach((key) => {
                        const lim = data.req.limitation[key];
                        Object.keys(lim).forEach((type) => {
                            search.push(`this_${type}=[${lim[type].join(',')}]`);
                        });
                    });
                    const items = await this.wappsto.find(
                        data.req.type, search.join('&'),
                        data.req.method, data.req.quantity, this.installation.id,
                    );
                    if (items.length) {
                        items.forEach((item) => {
                            opts.push({
                                name: item.name,
                                value: item.meta.id,
                            });
                        });
                        const results = [];
                        const answers = await tui.permissionRequest(data.req, opts);

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
                            await this.wappsto.updateACLRestriction(
                                data.installation, data.req.collection,
                            );
                        } else {
                            tui.showWarning(`Unknown '${data.req.method[0]}' permission request`);
                        }
                        await this.wappsto.readNotification(data.id, 'accepted');
                    } else {
                        await this.wappsto.readNotification(data.id, 'denied');
                    }
                } else if (data.req.name_installation) {
                    const answers = await tui.precisePermissionRequest(data.req);
                    if (answers.accept) {
                        await this.installation.setExtSync(true);
                        await this.wappsto.readNotification(data.id, 'accepted');
                    } else {
                        await this.wappsto.readNotification(data.id, 'denied');
                    }
                } else {
                    tui.showError('Failed to handle request', data.req);
                }
                tui.unblock();
            });
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

        let streams = await this.stream.getAll();
        for (let i = 0; i < streams.length; i += 1) {
            const subs = streams[i].subscription.toString();
            if (subs.indexOf('/notification') !== -1 && subs.indexOf('/installation') !== -1) {
                appStream = streams[i].meta.id;
                break;
            }
        }

        if (!appStream) {
            tui.showMessage('Creating new stream for notifications');
            const newStream = await this.stream.create(['/notification', '/installation']);
            if (newStream && newStream.meta) {
                appStream = newStream.meta.id;
            }
        }

        if (!this.appStream && appStream) {
            this.appStream = this.stream.open('app.', appStream, this.handleStreamEvent.bind(this));
        }

        streams = await this.stream.getAll(this.installation.session);
        if (streams) {
            for (let i = 0; i < streams.length; i += 1) {
                if (streams[i].subscription) {
                    const subs = streams[i].subscription.toString();
                    if (subs.indexOf('/extsync') !== -1 && subs.indexOf('/console') !== -1) {
                        lightStream = streams[i].meta.id;
                        break;
                    }
                }
            }

            if (!lightStream) {
                tui.showMessage('Creating new stream for background');
                const newStream = await this.stream.create(['/extsync', '/console'], this.installation.session);
                if (newStream && newStream.meta) {
                    lightStream = newStream.meta.id;
                }
            }

            if (!this.lightStream && lightStream) {
                this.lightStream = this.stream.open('light.', lightStream, this.handleStreamEvent.bind(this), this.installation.session);
            }
        }
    }
};
