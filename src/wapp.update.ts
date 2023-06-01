import Wapp from './wapp';
import tui from './util/tui';
import Spinner from './util/spinner';
import { section, measure } from './util/trace';
import questions from './util/questions';
import { compareVersions, validateFile, past } from './util/helpers';
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
          const override = await questions.remoteVersionUpdated();
          if (override === false) {
            throw new Error();
          }
          if (override.local) {
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
      throw err;
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
              tui.showVerbose('FILE', `${file.path} is changed on disk`, {
                version: lf.modified,
                file: fileTime,
              });
            }
          }

          if (overrideAll) {
            locallyUpdated = false;
          } else if (uploadAll) {
            remoteUpdated = false;
          }

          if (remoteUpdated && locallyUpdated) {
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
          }

          file.status = 'unknown';

          const runAsync = (
            type: string,
            file: File,
            code: (file: File) => Promise<void | boolean>
          ) => {
            results.push(
              new Promise<void>((resolve, reject) => {
                code(file)
                  .then(() => {
                    tui.showVerbose('UPDATE', `${file.path} ${past(type)}`);
                    file.status = `${past(type)}`;
                    updateFiles.push(file);
                    resolve();
                  })
                  .catch(() => {
                    tui.showVerbose('UPDATE', `Failed to ${type} ${file.path}`);
                    file.status = `not ${past(type)}`;
                    updateFiles.push(file);
                    reject();
                  });
              })
            );
          };

          if ((rf && !lf) || (remoteUpdated && !locallyUpdated)) {
            runAsync('download', file, (file: File) => {
              return file.download();
            });
          } else if (!remoteUpdated && locallyUpdated) {
            runAsync('update', file, (file: File) => {
              return file.update();
            });
          } else if (lf && !fileTime) {
            runAsync('delete', file, (file: File) => {
              return file.delete();
            });
          } else if (!rf && lf && !locallyUpdated) {
            runAsync('delete', file, async (file: File) => {
              const answers = await questions.askDeleteLocalFile(file.path);
              if (answers === false) {
                /* istanbul ignore next */
                throw new Error('User aborted');
              }

              if (answers.delete) {
                file.status = 'deleted';
                file.deleteLocal();
              }
            });
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
      throw err;
    }

    await section('Update version', async () => {
      let foundInstallation = await this.installation.fetchById(this.versionID);

      if (!foundInstallation) {
        tui.showWarning('Creating new installation');
        foundInstallation = await this.installation.create(this.versionID);
      }

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
              this.application.getVersion().save();
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
