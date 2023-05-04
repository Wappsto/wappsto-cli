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
import { setUser, section } from './util/trace';
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

  /* istanbul ignore next */
  get host(): string {
    return this.wappsto.HOST;
  }

  get versionID(): string {
    return this.application.getVersion().id;
  }

  /* istanbul ignore next */
  get hasForeground(): boolean {
    return this.installation.hasForeground;
  }

  /* istanbul ignore next */
  get hasBackground(): boolean {
    return this.installation.hasBackground;
  }

  async init(): Promise<void> {
    await section('Validate session', async () => {
      await this.wappsto.login();
      setUser(this.wappsto.session);
    });

    if (
      !(await section('Upgrading', async () => {
        if (!(await this.application.upgradeVersion())) {
          return false;
        }
        if (!(await this.installation.upgradeVersion())) {
          return false;
        }
        return true;
      }))
    ) {
      throw new Error('UpgradeError');
    }

    await section('Validating application', async () => {
      await this.application.validate();
    });
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
      'name_identifier',
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
    if (await this.installation.fetchById(this.versionID)) {
      return this.installation.session || '';
    }
    return '';
  }

  /* istanbul ignore next */
  getInstallationToken(): string {
    return this.installation.token;
  }
}
