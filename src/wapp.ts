import { Mutex } from 'async-mutex';
import pick from 'lodash.pick';
import {
  loadJsonFile,
  directoryExists,
  createFolders as createFolder,
  fileExists,
  deleteFile,
  deleteFolder,
  saveJsonFile,
} from './util/files';
import Trace, { setUser } from './util/trace';
import { Manifest } from './types/custom.d';
import Version from './version';
import Wappsto from './wappsto';
import Config from './config';

import Installation from './installation';
import Application from './application';

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
  manifest: Manifest;
  ignore_file: string;
  remote: boolean = false;

  constructor(remote: boolean = true) {
    this.remote = remote;
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
    this.manifest = loadJsonFile('manifest.json') as Manifest;
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
    let t = this.measure('Login', 'Validate session');
    await this.wappsto.login();
    setUser(this.wappsto.session);
    t.done();

    t = this.measure('Upgrading');
    await this.application.upgradeVersion();
    await this.installation.upgradeVersion();
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

  async getInstallationSession(): Promise<string> {
    const ret = await this.installation.fetchById(this.versionID);
    if (!ret) {
      return '';
    }
    return this.installation.session || '';
  }

  getInstallationToken(): string {
    return this.installation.token;
  }

  measure(name: string, description?: string, data?: any): Trace {
    return new Trace(name, description, data);
  }
}
