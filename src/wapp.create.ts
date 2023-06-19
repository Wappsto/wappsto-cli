import Wapp from './wapp.update';
import tui from './util/tui';
import Spinner from './util/spinner';
import questions from './util/questions';
import { section } from './util/trace';
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
  async create(): Promise<void> {
    const listWapps: any[] = [];
    let updateFiles;

    const wapps = await section('Loading all applications', async () => {
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
      return wapps;
    });

    const newWapp = await section('Wait for user input', () => {
      return questions.askCreateWapp(listWapps, this.present());
    });

    if (newWapp === false) {
      return;
    }

    let wapp;
    let new_app: Application | undefined;
    switch (newWapp.create) {
      case 'download':
        await section('Downloading wapp', async () => {
          wapp = wapps.find((w: Application) => w.id === newWapp.wapp);
          if (!wapp) {
            tui.showError('Failed to find Application from id');
            throw new Error('not_found');
          }
          this.deleteLocal();
          await this.downloadWapp(wapp);
        });
        break;
      case 'generate':
        await section('Generating wapp', async () => {
          new_app = await Application.create(this.manifest);
          if (!new_app) {
            throw new Error('Failed to generate Application');
          }
          this.application = new_app;

          await this.installation.create(this.versionID);
          this.saveApplication();
          Spinner.stop();

          updateFiles = await this.update();
          updateFiles.forEach(async (f: File) => {
            tui.showMessage(`${f.name} was ${f.status}`);
          });
        });

        if (this.application && this.installation.id) {
          tui.showMessage(`Wapp created with id: ${this.application.id}`);
        }
        break;
      case 'link':
        await section('Linking wapp', async () => {
          wapp = wapps.find((w: Application) => w.id === newWapp.wapp);
          if (!wapp) {
            tui.showError('Failed to find Application from id');
            throw new Error('not_found');
          }
          this.application = wapp;

          Spinner.setMessage('Downloading installation');
          let foundInstallation = await this.installation.fetchById(
            wapp.getVersion().id
          );

          if (!foundInstallation) {
            tui.showWarning('Creating new installation');
            foundInstallation = await this.installation.create(
              wapp.getVersion().id
            );
          }

          if (foundInstallation) {
            this.saveApplication();
            tui.showMessage(`Wapp ${wapp.getVersion().name} linked`);
          }
        });
        break;
      case 'new':
      default:
        await section('Creating wapp', async () => {
          new_app = await Application.create(newWapp);
          if (!new_app) {
            throw new Error('Failed to create Application');
          }

          this.application = new_app;
          const customFolders = {
            foreground: Config.foreground(),
            background: Config.background(),
          };
          Spinner.stop();
          await this.createFolders(
            newWapp.features,
            newWapp.examples,
            customFolders
          );
          Spinner.start();
          await this.installation.create(this.application.getVersion().id);
          this.saveApplication();
        });

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

  private async downloadWapp(app: Application): Promise<void> {
    Spinner.setMessage(`Downloading Wapp ${app.getVersion().name}`);

    this.application = app;
    await this.createFolders();

    const files = app.getVersion().getFiles();

    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];

      try {
        Spinner.setMessage(`Downloading ${file.path}`);
        await file.download();
      } catch (err) {
        file.deleteLocal();
      }
    }

    Spinner.setMessage('Downloading installation');
    if (await this.installation.fetchById(app.getVersion().id)) {
      this.saveApplication();

      Spinner.stop();
      tui.showMessage(`Downloaded Wapp ${app.getVersion().name}`);
    } else {
      Spinner.stop();
    }
  }

  private async createFolders(
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
    let exampleWapp = '';

    if (createExamples) {
      if (folders?.includes('background')) {
        exampleWapp = 'rssFeedConnect';
      } else {
        exampleWapp = 'addressConfigure';
      }
    }

    for (let i = 0; i < allDirs.length; i += 1) {
      const f = allDirs[i];
      const path = folderMapping ? folderMapping[f] || f : f;
      createFolder(`${path}/.`);

      if (createExamples && exampleFiles[f]) {
        const exPath = `${getDirName()}/../examples/${exampleWapp}/${f}`;

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
