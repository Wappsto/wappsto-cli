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
  deleteFile,
  deleteFolder,
  getAllFiles,
  saveJsonFile,
  getFileTimeISO,
} from './util/files';
import tui from './util/tui';
import questions from './util/questions';
import Trace, { setUser } from './util/trace';
import Wappsto from './wappsto';
import Config from './config';
import File from './file';
import { compareVersions, validateFile } from './util/helpers';
import getDirName from './util/getDirName';

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
  manifest: Record<string, any>;
  ignore_file: string;
  wappStream?: Stream;
  userStream?: Stream;
  sessionCallback: any;

  constructor(remote: boolean = true) {
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
    const t = this.measure('Login', 'Validate session');
    await this.wappsto.login();
    setUser(this.wappsto.session);
    t.done();
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

    let t = this.measure('Loading all applications');
    const status = new Spinner('Loading Wapps, please wait...');
    status.start();

    const wapps = await this.application.getAll();
    if (wapps.length) {
      wapps.forEach((w: Application) => {
        if (w.version && typeof w.version[0] !== 'string') {
          const { name } = w.version[0];
          listWapps.push({
            title: `${name} (${w.id})`,
            value: w.id,
          });
        }
      });
    }
    status.stop();
    t.done();

    t = this.measure('Ask the human');
    const newWapp = await questions.askForNewWapp(listWapps, this.present());
    if (newWapp === false) {
      return;
    }
    t.done();

    let new_app: Application | undefined;
    switch (newWapp.create) {
      case 'download':
        t = this.measure('Downloading wapp');
        const wapp = wapps.find((w: Application) => w.id === newWapp.wapp);
        if (!wapp) {
          tui.showError('Failed to find Application from id');
          return;
        }
        this.deleteLocal();
        await this.downloadWapp(wapp);
        t.done();
        break;
      case 'generate':
        t = this.measure('Generating wapp');
        status.setMessage('Creating Wapp, please wait...');
        status.start();

        if (this.manifest.meta) {
          this.saveManifest();
        }

        new_app = await Application.create(this.manifest);
        if (!new_app) {
          status.stop();
          t.done('unknown');
          throw new Error('Failed to generate Application');
        }
        this.application = new_app;

        await this.installation.create(this.versionID);
        this.saveApplication();
        status.stop();

        updateFiles = await this.update();
        updateFiles.forEach(async (f: File) => {
          if (validate) {
            const tmpFile = `${this.cacheFolder}file/${f.name}`;
            await f.download(tmpFile);

            const localFile = loadFile(f.path);
            const remoteFile = loadFile(tmpFile);

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
        t.done();
        break;
      default:
        t = this.measure('Creating wapp');
        status.setMessage('Creating Wapp, please wait...');
        status.start();

        new_app = await Application.create(newWapp);
        if (!new_app) {
          status.stop();
          t.done('unknown');
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
        t.done();
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
        const exPath = `${getDirName()}/../examples/bare/${f}`;

        if (overwrite === undefined) {
          for (let j = 0; j < exampleFiles[f].length; j += 1) {
            if (fileExists(`${path}/${exampleFiles[f][j]}`)) {
              /* eslint-disable-next-line no-await-in-loop */
              const answers = await questions.askOverwriteFiles();
              if (answers === false) {
                return;
              }
              overwrite = answers.overwrite;
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

    this.application = app;
    await this.createFolders();

    const files = app.getVersion().getFiles();

    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];

      try {
        status.setMessage(`Downloading ${file.name}, please wait...`);
        await file.download();
      } catch (err) {
        file.deleteLocal();
      }
    }

    status.setMessage('Downloading installation, please wait...');
    await this.installation.fetchById(app.getVersion().id);
    this.saveApplication();

    status.stop();
    tui.showMessage(`Downloaded Wapp ${app.getVersion().name}`);
  }

  saveApplication(): any {
    this.application.save();
    this.saveManifest(this.application.getVersion());
  }

  saveManifest(version?: Version): void {
    let data;
    if (version) {
      data = version.toJSON();
    } else {
      data = this.manifest;
    }
    const newVersion = pick(data, [
      'name',
      'author',
      'version_app',
      'max_number_installation',
      'supported_features',
      'description',
      'permission',
    ]);
    saveJsonFile('manifest.json', newVersion);
    this.manifest = newVersion;
  }

  async uploadFile(filePath: string): Promise<void> {
    const localVersion = this.application.getVersion();
    const localFile = localVersion.findFile(filePath);

    if (localFile) {
      await localFile.update();

      await this.installation.restart();

      tui.showMessage(`${filePath} was updated`);
    } else {
      tui.showVerbose(
        'WAPP',
        `${filePath} was changed but is not part of the version`
      );
    }
  }

  getAllLocalFiles(): string[] {
    let localFiles: string[] = [];
    this.wapp_folders.forEach((folder: string) => {
      localFiles = localFiles.concat(
        getAllFiles(folder, validateFile, this.ignoreFolders)
      );
    });
    return localFiles;
  }

  async update(reinstall?: boolean): Promise<File[]> {
    if (!this.present()) {
      return [];
    }

    const results = [];
    let localFiles: string[] = [];
    const updateFiles = [];
    let upload = true;
    let overrideAll = false;
    let uploadAll = false;

    let t = this.measure('Compare versions');
    const localVersion = this.application.getVersion();

    const status = new Spinner('Updating Wapp, please wait...');
    status.start();

    status.setMessage('Downloading version, please wait...');
    const remoteVersion = await localVersion.clone();

    if (
      remoteVersion &&
      remoteVersion.revision !== localVersion.revision &&
      !compareVersions(this.manifest, remoteVersion.toJSON())
    ) {
      status.stop();
      const overide = await questions.remoteVersionUpdated();
      status.start();
      if (overide === false) {
        return [];
      }
      if (overide.local) {
        upload = false;
      }
    }
    if (upload) {
      status.setMessage('Updating version, please wait...');
      const version = this.application.getVersion();
      version.parse(this.manifest);
      if (!(await version.update())) {
        status.stop();
        t.done('unknown');
        return [];
      }
    }
    t.done();

    t = this.measure('Comparing files');
    // Find all files on disk
    localFiles = this.getAllLocalFiles();

    // Get both remote and local files into a single array
    const cmp = (item: File, file: File) => item.path === file.path;

    const localVersionFiles = localVersion.getFiles();
    const remoteVersionFiles = remoteVersion.getFiles();

    const allFiles = remoteVersionFiles.concat(
      localVersionFiles.filter(
        (item: any) => !remoteVersionFiles.find((file: File) => cmp(item, file))
      )
    );

    for (let i = 0; i < allFiles.length; i += 1) {
      const file = allFiles[i];
      if (!file) {
        continue;
      }

      let remoteUpdated = false;
      let locallyUpdated = false;
      let fileTime = null;

      const rf = remoteVersion.findFile(file.path);
      const lf = localVersion.findFile(file.path);

      const localIndex = localFiles.indexOf(file.path);
      if (localIndex !== -1) {
        localFiles.splice(localFiles.indexOf(file.path), 1);
      }

      fileTime = getFileTimeISO(file.path);

      if (lf && rf) {
        if (rf.meta.updated !== lf.meta.updated) {
          remoteUpdated = true;
          tui.showVerbose('FILE', `${file.path} is changed on the server`, {
            remote: rf.meta.updated,
            local: lf.meta.updated,
          });
        }
        if (fileTime && lf.modified !== fileTime) {
          locallyUpdated = true;
          tui.showVerbose('FILE', `${file.path} is changed on disk`);
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
          const answers = await questions.fileConflict(file.path);
          if (answers === false) {
            return [];
          }
          switch (answers.conflict) {
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
            // eslint-disable-next-line no-fallthrough
            default:
          }
        }
        status.start();
      }

      file.status = 'unknown';

      if ((rf && !lf) || (remoteUpdated && !locallyUpdated)) {
        try {
          status.setMessage(`Downloading ${file.path}, please wait...`);
          results.push(file.download());
          file.status = 'downloaded';
        } catch (err) {
          file.status = 'not downloaded';
        }
      } else if (!remoteUpdated && locallyUpdated) {
        status.setMessage(`Uploading ${file.path}, please wait...`);
        file.status = 'updated';
        results.push(file.update());
      } else if (lf && !fileTime) {
        file.status = 'deleted';
        if (rf) {
          status.setMessage(`Deleting ${file.path}, please wait...`);
          results.push(file.delete());
        }
      } else if (!rf && lf && !locallyUpdated) {
        status.stop();
        // eslint-disable-next-line no-await-in-loop
        const answers = await questions.askDeleteLocalFile(file.path);
        status.start();
        if (answers === false) {
          return [];
        }

        if (answers.delete) {
          file.status = 'deleted';
          file.deleteLocal();
        }
      }
      if (file.status !== 'unknown') {
        updateFiles.push(file);
      }
    }

    for (let i = 0; i < localFiles.length; i += 1) {
      const filePath = localFiles[i];
      status.setMessage(`Creating ${filePath}, please wait...`);

      // eslint-disable-next-line no-await-in-loop
      const newFile = await this.application.getVersion().createFile(filePath);

      if (newFile) {
        newFile.status = 'created';
        updateFiles.push(newFile);
      }
    }
    t.done();

    t = this.measure('Update version');
    status.setMessage('Loading version, please wait...');
    await this.installation.fetchById(this.versionID);

    if (reinstall) {
      results.push(this.installation.reinstall());
    } else {
      results.push(this.installation.restart());
    }
    results.push(this.application.getVersion().fetch());

    await Promise.all(results);
    status.setMessage('Loading application, please wait...');

    await new Promise<void>((resolve) => {
      const ts = this.measure('Wait', 'Waiting for files to be updated');
      setTimeout(() => {
        try {
          this.application.fetch().then(() => {
            this.application.syncFiles();
            this.saveApplication();
            ts.done();
            resolve();
          });
        } catch (err) {
          ts.done(err);
          /* istanbul ignore next */
          resolve();
        }
      }, 500);
    });

    status.stop();
    t.done();

    return updateFiles;
  }

  async publish(): Promise<void> {
    if (!this.present()) {
      return;
    }

    const status = new Spinner('Loading application, please wait...');
    status.start();
    await this.application.fetch();
    status.stop();

    const answers = await questions.askPublishWapp(this.manifest.version_app);
    if (answers === false) {
      return;
    }

    status.setMessage('Publishing new version, please wait...');
    status.start();

    const res = await this.application.publish(answers.version);
    if (res) {
      this.saveApplication();
      status.stop();

      tui.showMessage(`Wapp published with version ${answers.version}`);
    } else {
      status.stop();
    }
  }

  async configure(): Promise<void> {
    if (!this.present()) {
      return;
    }

    let t = this.measure('Load application');
    await this.application.fetch();
    t.done();

    t = this.measure('Ask the human');
    const answer = await questions.configureWapp(
      this.application.getOAuthExternal(),
      this.application.getOAuthClient(),
      this.manifest.permission
    );
    t.done();

    if (answer === false) {
      return;
    }

    if (answer.extsync) {
      t = this.measure('setExtSync');
      this.installation.setExtSync(answer.extsync);
      t.done();
    } else if (answer.api_site) {
      t = this.measure('createOauthExternal');
      this.application.createOauthExternal(answer);
      t.done();
    } else if (answer.redirect_uri) {
      t = this.measure('createOauthClient');
      this.application.createOauthClient(answer);
      t.done();
    } else if (answer.create) {
      t = this.measure('changePermission');
      this.manifest.permission = answer;
      this.saveManifest();
      this.application.getVersion().permission = answer;
      await this.application.getVersion().update();
      t.done();
    }
  }

  async delete(): Promise<void> {
    if (!this.present()) {
      return;
    }

    const answer = await questions.deleteWapp();
    if (answer === false) {
      return;
    }
    if (answer.del) {
      if (!answer.local && !answer.remote) {
        tui.showWarning('Nothing deleted');
        return;
      }

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
      tui.showMessage('Wapp deleted');
    }
  }

  async getInstallationSession(): Promise<string> {
    const ret = await this.installation.fetchById(this.versionID);
    if (!ret) {
      return '';
    }
    if (this.sessionCallback) {
      this.sessionCallback(this.installation.session);
    }
    return this.installation.session || '';
  }

  getInstallationToken(): string {
    return this.installation.token;
  }

  async handleStreamEvent(data: any): Promise<void> {
    if (data?.application !== this.application.id) {
      return;
    }

    if (data?.installation !== this.installation.id) {
      return;
    }

    if (data.reinstall) {
      const oldSession = this.installation.session;
      const newSession = await this.getInstallationSession();
      if (oldSession !== newSession) {
        this.wappStream?.close();
        this.wappStream?.open();
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
            if (answers === false) {
              return;
            }

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
          if (answers === false) {
            return;
          }

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
          if (answers === false) {
            return;
          }
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
    if (sessionCallback) {
      this.sessionCallback = sessionCallback;
    }

    this.userStream = new Stream(
      this.wappsto,
      ['/notification', '/installation'],
      this.handleStreamEvent
    );

    this.userStream.open();

    this.wappStream = new Stream(
      this.wappsto,
      ['/extsync', '/console'],
      this.handleStreamEvent,
      this.installation.session
    );

    this.wappStream.open();
  }

  measure(name: string, description?: string, data?: any): Trace {
    return new Trace(name, description, data);
  }
}
