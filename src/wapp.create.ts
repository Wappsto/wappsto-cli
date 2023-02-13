import Wapp from './wapp.update';
import tui from './util/tui';
import Spinner from './util/spinner';
import questions from './util/questions';
import Application from './application';
import File from './file';
import {
  fileExists,
  saveFile,
  loadFile,
  copyFile,
  createFolders as createFolder,
} from './util/files';
import Config from './config';
import getDirName from './util/getDirName';


export default class CreateWapp extends Wapp {
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
                /* istanbul ignore next */
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
}