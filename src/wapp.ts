import fs from 'fs';
import { Mutex } from 'async-mutex';
import pick from 'lodash.pick';
import Stream from './stream';
import Installation from './installation';
import Application from './application';
import Version from './version';
import Spinner from './util/spinner';
import {
  loadJsonFile,
  directoryExists,
  createFolders as createFolder,
  fileExists,
  saveFile,
  loadFile,
  copyFile,
  moveFile,
  deleteFile,
  deleteFolder,
  getAllFiles,
  saveJsonFile,
} from './util/files';
import tui from './util/tui';
import questions from './util/questions';
import Wappsto from './wappsto';
import Config from './config';
import {
  getFilePath,
  compareVersions,
  validateFile,
  getFileType,
  getFileName,
  getFileUse,
} from './util/helpers';

export default class Wapp {
  mutex: Mutex;
  wapp_files: string[];
  ignoreFolders: string[];
  wapp_folders: string[];
  wapp_folders_create: string[];
  cacheFolder: string;
  wappsto: Wappsto;
  application: Application;
  installation: Installation;
  stream: Stream;
  manifest: any;
  ignore_file: string;
  lightStream: any;
  appStream: any;
  sessionCallback: any;

  constructor(verbose: boolean = false, remote: boolean = true) {
    tui.verbose = verbose;
    this.mutex = new Mutex();
    this.cacheFolder = Config.cacheFolder();
    this.initCacheFolder();
    this.wapp_files = [
      `${this.cacheFolder}application`,
      `${this.cacheFolder}installation`,
      'manifest.json',
    ];
    this.ignoreFolders = ['node_modules', '.node_modules'];
    this.wapp_folders = [Config.foreground(), Config.background(), 'icon'];
    this.wapp_folders_create = ['icon'];
    this.wappsto = new Wappsto();
    this.application = new Application(
      loadJsonFile(`${this.cacheFolder}application`)
    );
    this.installation = new Installation();
    this.stream = new Stream(this.wappsto, this.installation, remote);
    this.manifest = loadJsonFile('manifest.json');
    this.ignore_file = `${this.cacheFolder}\nnode_modules\n`;
  }

  get host(): string {
    return this.wappsto.HOST;
  }

  get versionID(): string {
    return this.application.getVersion().id;
  }

  get hasForeground(): boolean {
    return this.installation.hasForeground;
  }

  get hasBackground(): boolean {
    return this.installation.hasBackground;
  }

  async init(): Promise<void> {
    await this.wappsto.login();
  }

  initCacheFolder(): void {
    if (!directoryExists(this.cacheFolder)) {
      createFolder(this.cacheFolder);
    }
  }

  present(): any {
    let oldWapp = false;
    this.wapp_files.forEach((f) => {
      oldWapp = oldWapp || fileExists(f);
    });
    return oldWapp;
  }

  deleteLocal(): void {
    this.wapp_files.forEach((f) => {
      deleteFile(f);
    });
    this.wapp_folders.forEach((f) => {
      deleteFolder(f);
    });
  }

  async create(validate: boolean): Promise<void> {
    const listWapps: any[] = [];
    let updateFiles;
    const status = new Spinner('Loading Wapps, please wait...');
    status.start();

    const wapps = await this.application.getAll();
    if (wapps.length) {
      wapps.forEach((w: Application) => {
        if (w.version && typeof w.version[0] !== 'string') {
          const { name } = w.version[0];
          listWapps.push({
            name: `${name} (${w.id})`,
            value: w.id,
          });
        }
      });
    }

    status.stop();

    const newWapp = await questions.askForNewWapp(listWapps, this.present());
    if (newWapp === false) {
      return;
    }

    let new_app: Application | undefined;
    switch (newWapp.create) {
      case 'download':
        const wapp = wapps.find((w: Application) => w.id === newWapp.wapp);
        if (!wapp) {
          tui.showError('Failed to find Application from id');
          return;
        }
        this.deleteLocal();
        await this.downloadWapp(wapp);
        break;
      case 'generate':
        status.setMessage('Creating Wapp, please wait...');
        status.start();

        if (this.manifest.meta) {
          this.manifest = this.saveManifest(this.manifest);
        }

        new_app = await Application.create(this.manifest);
        if (!new_app) {
          status.stop();
          throw new Error('Failed to generate Application');
        }
        this.application = new_app;

        await this.installation.create(this.versionID);
        this.manifest = this.saveApplication();
        status.stop();

        updateFiles = await this.update();
        updateFiles.forEach(async (f: any) => {
          if (validate) {
            await this.wappsto.downloadFile(
              `file/${f.id}`,
              `${this.cacheFolder}file/${f.name}`
            );
            const localFile = loadFile(f.name);
            const remoteFile = loadFile(`${this.cacheFolder}file/${f.name}`);
            if (localFile && remoteFile) {
              const localBuff = Buffer.from(localFile);
              const remoteBuff = Buffer.from(remoteFile);

              if (localBuff.compare(remoteBuff) !== 0) {
                tui.showError(`${f.name} was not uploaded correctly`);
                return;
              }
            }
          }
          tui.showMessage(`${f.name} was ${f.status}`);
        });

        if (this.application && this.installation.id) {
          tui.showMessage(`Wapp created with id: ${this.application.id}`);
        }
        break;
      default:
        status.setMessage('Creating Wapp, please wait...');
        status.start();

        new_app = await Application.create(newWapp);
        if (!new_app) {
          status.stop();
          throw new Error('Failed to create Application');
        }

        this.application = new_app;
        const customFolders = {
          foreground: Config.foreground(),
          background: Config.background(),
        };
        status.stop();
        await this.createFolders(
          newWapp.features,
          newWapp.examples,
          customFolders
        );
        status.start();
        await this.installation.create(this.application.getVersion().id);
        this.saveApplication();

        status.stop();

        if (this.application) {
          tui.showMessage(`Wapp created with id: ${this.application.id}`);
        }
        break;
    }

    if (fileExists('.gitignore')) {
      let ignore = loadFile('.gitignore');
      let addLines = '';
      this.ignore_file.split('\n').forEach((line: string) => {
        if (ignore && !ignore.includes(line)) {
          addLines += `${line}\n`;
        }
      });
      if (addLines) {
        ignore += `\n${addLines}`;
        saveFile('.gitignore', ignore);
      }
    } else {
      saveFile('.gitignore', this.ignore_file);
    }
  }

  async createFolders(
    folders?: string[],
    createExamples?: boolean,
    folderMapping?: { [key: string]: string }
  ): Promise<void> {
    const dirs = folders || this.wapp_folders;
    const exampleFiles: { [key: string]: string[] } = {
      foreground: ['main.js', 'index.html'],
      background: ['main.js', 'package.json'],
    };
    const allDirs = dirs.concat(this.wapp_folders_create);
    let overwrite;

    for (let i = 0; i < allDirs.length; i += 1) {
      const f = allDirs[i];
      const path = folderMapping ? folderMapping[f] || f : f;
      createFolder(`${path}/.`);

      if (createExamples && exampleFiles[f]) {
        const exPath = `${__dirname}/../examples/simple/${f}`;

        if (overwrite === undefined) {
          for (let j = 0; j < exampleFiles[f].length; j += 1) {
            if (fileExists(`${path}/${exampleFiles[f][j]}`)) {
              /* eslint-disable-next-line no-await-in-loop */
              const answer = await questions.askOverwriteFiles();
              overwrite = answer.overwrite;
              break;
            }
          }
        }
        for (let j = 0; j < exampleFiles[f].length; j += 1) {
          const file = exampleFiles[f][j];
          if (!fileExists(`${path}/${file}`) || overwrite === true) {
            copyFile(`${exPath}/${file}`, `${path}/${file}`);
          }
        }
      }
    }
  }

  async downloadWapp(app: Application): Promise<void> {
    const status = new Spinner(`Downloading Wapp ${app.getVersion().name}`);
    status.start();

    this.application = new Application(app);
    await this.createFolders();

    /*
    for (let i = 0; i < app.version[0].file.length; i += 1) {
      const file = app.version[0].file[i];
      const filePath = `${getFilePath(file.use)}/${file.name}`;
      try {
        status.setMessage(`Downloading ${filePath}, please wait...`);
        // eslint-disable-next-line no-await-in-loop
        await this.wappsto.downloadFile(`file/${file.meta.id}`, filePath);
        const stats = fs.statSync(filePath);
        file.meta.modified = stats.mtime;
      } catch (err) {
        deleteFile(filePath);
      }
    }
*/
    status.setMessage('Downloading installation, please wait...');
    await this.installation.fetchById(app.getVersion().id);
    this.saveApplication();

    status.stop();
    tui.showMessage(`Downloaded Wapp ${app.getVersion().name}`);
  }

  saveApplication(): any {
    this.application.save();
    return this.saveManifest(this.application.getVersion());
  }

  saveManifest(version: Version): any {
    const newVersion = pick(version.toJSON(), [
      'name',
      'author',
      'version_app',
      'max_number_installation',
      'supported_features',
      'description',
      'permission',
    ]);
    saveJsonFile('manifest.json', newVersion);
    return newVersion;
  }

  async uploadFile(filePath: string): Promise<void> {
    const localVersion = this.application.getVersion();
    const localFile = localVersion.findFile(filePath);

    if (localFile) {
      const newFile = await this.wappsto.updateFile(
        this.versionID,
        localFile.meta.id,
        filePath
      );
      localVersion.updateFile(filePath, newFile);

      await this.installation.restart();

      tui.showMessage(`${filePath} was updated`);
    } else {
      tui.showVerbose(
        'WAPP',
        `${filePath} was changed but is not part of the version`
      );
    }
  }

  async update(reinstall?: boolean): Promise<any[]> {
    if (!this.present()) {
      return [];
    }

    const results = [];
    let localFiles: string[] = [];
    const updateFiles = [];
    let upload = true;
    let overrideAll = false;
    let uploadAll = false;

    const localVersion = this.application.getVersion();

    const status = new Spinner('Updating Wapp, please wait...');
    status.start();

    status.setMessage('Downloading version, please wait...');
    const remoteVersion = await localVersion.get();

    if (
      remoteVersion &&
      remoteVersion.revision !== localVersion.revision &&
      !compareVersions(this.manifest, remoteVersion.data)
    ) {
      status.stop();
      const overide = await questions.remoteVersionUpdated();
      status.start();
      if (overide.local) {
        upload = false;
      }
    }
    if (upload) {
      status.setMessage('Updating version, please wait...');
      if (!(await this.application.getVersion().update(this.manifest))) {
        status.stop();
        return [];
      }
    }

    // Find all files on disk
    this.wapp_folders.forEach((f) => {
      localFiles = localFiles.concat(
        getAllFiles(f, validateFile, this.ignoreFolders)
      );
    });

    // Get both remote and local files into a single array
    const cmp = (item: any, file: any) =>
      item.use === file.use && item.name === file.name;
    const allFiles = !remoteVersion
      ? localVersion.file
      : remoteVersion.file.concat(
          localVersion.file.filter(
            (item: any) =>
              !remoteVersion.file.find((file: any) => cmp(item, file))
          )
        );

    for (let i = 0; i < allFiles.length; i += 1) {
      const f = allFiles[i];
      if (!f) {
        continue;
      }
      let remoteUpdated = false;
      let locallyUpdated = false;
      let fileTime = null;
      const filePath = `${getFilePath(f.use)}/${f.name}`;

      const rf = !remoteVersion ? null : remoteVersion.findFile(filePath);
      const lf = localVersion.findFile(filePath);

      const localIndex = localFiles.indexOf(filePath);
      if (localIndex !== -1) {
        localFiles.splice(localFiles.indexOf(filePath), 1);
      }

      if (fileExists(filePath)) {
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
        let run = true;
        while (run) {
          run = false;
          // eslint-disable-next-line no-await-in-loop
          const answer = await questions.fileConflict(filePath);
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
        status.start();
      }

      const fileStatus = {
        id: f.meta.id,
        name: filePath,
        status: 'unknown',
      };
      if ((rf && !lf) || (remoteUpdated && !locallyUpdated)) {
        try {
          status.setMessage(`Downloading ${filePath}, please wait...`);
          results.push(
            this.wappsto.downloadFile(`file/${f.meta.id}`, filePath)
          );
          fileStatus.status = 'downloaded';
        } catch (err) {
          fileStatus.status = 'not downloaded';
        }
      } else if (!remoteUpdated && locallyUpdated) {
        status.setMessage(`Uploading ${filePath}, please wait...`);
        fileStatus.status = 'updated';
        results.push(
          this.wappsto.updateFile(this.versionID, f.meta.id, filePath)
        );
      } else if (lf && !fileTime) {
        fileStatus.status = 'deleted';
        if (rf) {
          status.setMessage(`Deleting ${filePath}, please wait...`);
          results.push(this.wappsto.deleteFile(f.meta.id));
        }
      } else if (!rf && lf && !locallyUpdated) {
        status.stop();
        // eslint-disable-next-line no-await-in-loop
        const answer = await questions.askDeleteLocalFile(filePath);
        status.start();
        if (answer.delete) {
          fileStatus.status = 'deleted';
          deleteFile(filePath);
        }
      }
      if (fileStatus.status) {
        updateFiles.push(fileStatus);
      }
    }

    for (let i = 0; i < localFiles.length; i += 1) {
      const f = localFiles[i];
      status.setMessage(`Creating ${f}, please wait...`);

      const file = {
        type: getFileType(f),
        name: getFileName(f),
        use: getFileUse(f),
      };

      // eslint-disable-next-line no-await-in-loop
      const newFile = await this.wappsto.createFile(this.versionID, file, f);
      if (newFile) {
        updateFiles.push({
          id: newFile.meta.id,
          name: f,
          status: 'created',
        });
      }
    }

    status.setMessage('Loading version, please wait...');
    await this.installation.fetchById(this.versionID);

    if (reinstall) {
      results.push(this.installation.reinstall());
    } else {
      results.push(this.installation.restart());
    }

    await Promise.all(results);
    status.setMessage('Loading application, please wait...');

    await new Promise<void>((resolve) => {
      setTimeout(async () => {
        try {
          const newApp = await this.application.get();
          if (newApp) {
            if (newApp.version && newApp.version[0] && newApp.version[0].file) {
              for (let i = 0; i < newApp.version[0].file.length; i += 1) {
                const f = newApp.version[0].file[i];
                const filePath = `${getFilePath(f.use)}/${f.name}`;
                if (fileExists(filePath)) {
                  const stats = fs.statSync(filePath);
                  f.meta.modified = stats.mtime;
                }
              }
            }
            this.application.parse(newApp);
            this.saveApplication();
          } else {
            this.saveApplication();
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

  async configure(): Promise<void> {
    if (!this.present()) {
      return;
    }
    const app = await this.application.get();
    const answer = await questions.configureWapp(
      app.oauth_external,
      app.oauth_client
    );

    if (answer.extsync) {
      this.installation.setExtSync(answer.extsync);
    } else if (answer.api_site) {
      this.application.createOauthExternal(answer, app.oauth_external);
    } else if (answer.redirect_uri) {
      this.application.createOauthClient(answer);
    }
  }

  async delete(): Promise<void> {
    if (!this.present()) {
      return;
    }

    const answer = await questions.deleteWapp();

    if (answer.del) {
      const status = new Spinner('Deleting Wapp, please wait...');
      status.start();

      if (answer.local) {
        this.deleteLocal();
      }
      if (answer.remote) {
        const results = [];

        this.application.version.forEach((v: any) => {
          if (v.id) {
            results.push(v.delete());
            results.push(this.installation.deleteById(v.id));
          }
        });

        if (this.application.id) {
          results.push(this.application.delete());
        }
        try {
          await Promise.all(results);
        } catch (err) {
          status.stop();
          tui.showError(`Failed to delete application: ${err}`);
          return;
        }
      }

      status.stop();
      if (answer.local || answer.remote) {
        tui.showMessage('Wapp deleted');
      } else {
        tui.showWarning('Nothing deleted');
      }
    }
  }

  async getInstallationSession(): Promise<string | null> {
    const ret = await this.installation.fetchById(this.versionID);
    if (!ret) {
      return null;
    }
    if (this.sessionCallback) {
      this.sessionCallback(this.installation.session);
    }
    return this.installation.session;
  }

  getInstallationToken(): string {
    return this.installation.token;
  }

  async handleStreamEvent(data: any): Promise<void> {
    if (data && data.application !== this.application.id) {
      return;
    }

    if (data && data.installation !== this.installation.id) {
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
    } else if (data.status) {
      tui.showStatus(data.status);
      if (data.session) {
        await this.getInstallationSession();
      }
    } else if (data.req) {
      await this.mutex.runExclusive(async () => {
        tui.block();
        const opts: any[] = [];
        const search: string[] = [];
        if (data.req.limitation) {
          Object.keys(data.req.limitation).forEach((key) => {
            const lim = data.req.limitation[key];
            Object.keys(lim).forEach((type) => {
              search.push(`this_${type}=[${lim[type].join(',')}]`);
            });
          });
          const items = await this.wappsto.find(
            data.req.type,
            search.join('&'),
            data.req.method,
            data.req.quantity,
            this.installation.id
          );
          if (items.length) {
            items.forEach((item: any) => {
              opts.push({
                name: `${item.name} (${item.meta.id})`,
                value: item.meta.id,
              });
            });
            const results = [];
            const answers = await questions.permissionRequest(data.req, opts);

            answers.permission.forEach((per: string) => {
              results.push(
                this.wappsto.updateACL(
                  per,
                  data.installation,
                  [],
                  data.req.method
                )
              );
            });
            let status = 'read';
            if (answers.permission.length) {
              status = 'accepted';
            }
            results.push(this.wappsto.readNotification(data.id, status));

            await Promise.all(results);
          } else {
            tui.showWarning(
              `Failed to find anything matching the permission request from ${data.req.name_installation}`
            );
          }
        } else if (data.req.collection) {
          const answers = await questions.precisePermissionRequest(data.req);

          if (answers.accept) {
            if (data.req.method[0] === 'add') {
              await this.wappsto.updateACLRestriction(
                data.installation,
                data.req.collection
              );
            } else {
              tui.showWarning(
                `Unknown '${data.req.method[0]}' permission request`
              );
            }
            await this.wappsto.readNotification(data.id, 'accepted');
          } else {
            await this.wappsto.readNotification(data.id, 'denied');
          }
        } else if (data.req.name_installation) {
          const answers = await questions.precisePermissionRequest(data.req);
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

  async openStream(sessionCallback?: any): Promise<void> {
    let appStream;
    let lightStream;

    if (sessionCallback) {
      this.sessionCallback = sessionCallback;
    }

    let streams = await this.stream.getAll();
    for (let i = 0; i < streams.length; i += 1) {
      const subs = streams[i].subscription.toString();
      if (
        subs.indexOf('/notification') !== -1 &&
        subs.indexOf('/installation') !== -1
      ) {
        appStream = streams[i].meta.id;
        break;
      }
    }

    if (!appStream) {
      tui.showMessage('Creating new stream for notifications');
      const newStream = await this.stream.create([
        '/notification',
        '/installation',
      ]);
      if (newStream && newStream.meta) {
        appStream = newStream.meta.id;
      }
    }

    if (!this.appStream && appStream) {
      this.appStream = this.stream.open('app.', appStream, (data: any) =>
        this.handleStreamEvent(data)
      );
    }

    streams = await this.stream.getAll(this.installation.session);
    if (streams) {
      for (let i = 0; i < streams.length; i += 1) {
        if (streams[i].subscription) {
          const subs = streams[i].subscription.toString();
          if (
            subs.indexOf('/extsync') !== -1 &&
            subs.indexOf('/console') !== -1
          ) {
            lightStream = streams[i].meta.id;
            break;
          }
        }
      }

      if (!lightStream) {
        tui.showMessage('Creating new stream for background');
        const newStream = await this.stream.create(
          ['/extsync', '/console'],
          this.installation.session
        );
        if (newStream && newStream.meta) {
          lightStream = newStream.meta.id;
        }
      }

      if (!this.lightStream && lightStream) {
        this.lightStream = this.stream.open(
          'light.',
          lightStream,
          (data: any) => this.handleStreamEvent(data),
          this.installation.session
        );
      }
    }
  }
}
