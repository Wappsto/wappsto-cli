import Wapp from './wapp';
import tui from './util/tui';
import Spinner from './util/spinner';
import { section, measure } from './util/trace';
import questions from './util/questions';
import { compareVersions, validateFile } from './util/helpers';
import { getFileTimeISO, getAllFiles } from './util/files';
import Version from './version';
import File from './file';

export default class UpdateWapp extends Wapp {
  async update(reinstall?: boolean): Promise<File[]> {
    if (!this.present()) {
      return [];
    }

    const results: any[] = [];
    let localFiles: string[] = [];
    const updateFiles: File[] = [];
    let upload = true;
    let overrideAll = false;
    let uploadAll = false;
    let localVersion: Version;
    let remoteVersion: Version;

    try {
      await section('Comparing versions', async () => {
        localVersion = this.application.getVersion();

        Spinner.setMessage('Downloading version');
        remoteVersion = await localVersion.clone();

        if (
          remoteVersion &&
          remoteVersion.revision !== localVersion.revision &&
          !compareVersions(this.manifest, remoteVersion.toJSON())
        ) {
          const overide = await questions.remoteVersionUpdated();
          if (overide === false) {
            throw new Error();
          }
          if (overide.local) {
            upload = false;
          }
        }
        if (upload) {
          Spinner.setMessage('Updating version');
          const version = this.application.getVersion();
          version.parse(this.manifest);
          if (!(await version.update())) {
            throw new Error();
          }
        }
      });
    } catch (err) {
      return [];
    }

    try {
      await section('Comparing files', async () => {
        // Find all files on disk
        localFiles = this.getAllLocalFiles();

        // Get both remote and local files into a single array
        const cmp = (item: File, file: File) => item.path === file.path;

        const localVersionFiles = localVersion.getFiles();
        const remoteVersionFiles = remoteVersion.getFiles();

        const allFiles = remoteVersionFiles.concat(
          localVersionFiles.filter(
            (item: any) =>
              !remoteVersionFiles.find((file: File) => cmp(item, file))
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
            Spinner.stop();
            let run = true;
            while (run) {
              run = false;
              // eslint-disable-next-line no-await-in-loop
              const answers = await questions.fileConflict(file.path);
              if (answers === false) {
                /* istanbul ignore next */
                throw new Error('User aborted');
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
            Spinner.start();
          }

          file.status = 'unknown';

          if ((rf && !lf) || (remoteUpdated && !locallyUpdated)) {
            try {
              Spinner.setMessage(`Downloading ${file.path}`);
              results.push(file.download());
              file.status = 'downloaded';
            } catch (err) {
              file.status = 'not downloaded';
            }
          } else if (!remoteUpdated && locallyUpdated) {
            Spinner.setMessage(`Uploading ${file.path}`);
            file.status = 'updated';
            results.push(file.update());
          } else if (lf && !fileTime) {
            file.status = 'deleted';
            if (rf) {
              Spinner.setMessage(`Deleting ${file.path}`);
              results.push(file.delete());
            }
          } else if (!rf && lf && !locallyUpdated) {
            Spinner.stop();
            // eslint-disable-next-line no-await-in-loop
            const answers = await questions.askDeleteLocalFile(file.path);
            Spinner.start();
            if (answers === false) {
              /* istanbul ignore next */
              throw new Error('User aborted');
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
          Spinner.setMessage(`Creating ${filePath}`);

          // eslint-disable-next-line no-await-in-loop
          const newFile = await this.application
            .getVersion()
            .createFile(filePath);

          if (newFile) {
            newFile.status = 'created';
            updateFiles.push(newFile);
          }
        }
      });
    } catch (err) {
      return [];
    }

    await section('Update version', async () => {
      const foundInstallation = await this.installation.fetchById(
        this.versionID
      );

      if (foundInstallation) {
        if (reinstall) {
          results.push(this.installation.reinstall());
        } else {
          results.push(this.installation.restart());
        }
      }
      results.push(this.application.getVersion().fetch());

      await Promise.all(results);
      Spinner.setMessage('Loading application');

      await new Promise<void>((resolve) => {
        const ts = measure('Wait', 'Waiting for files to be updated');
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
            resolve();
          }
        }, 500);
      });
    });

    return updateFiles;
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
}
