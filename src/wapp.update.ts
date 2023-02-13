import Wapp from './wapp';
import tui from './util/tui';
import Spinner from './util/spinner';
import questions from './util/questions';
import File from './file';
import { compareVersions, validateFile } from './util/helpers';
import {
  getFileTimeISO,
  getAllFiles,
} from './util/files';

export default class UpdateWapp extends Wapp {
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
            /* istanbul ignore next */
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
          /* istanbul ignore next */
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
    const foundInstallation = await this.installation.fetchById(this.versionID);

    if (foundInstallation) {
      if (reinstall) {
        results.push(this.installation.reinstall());
      } else {
        results.push(this.installation.restart());
      }
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
          resolve();
        }
      }, 500);
    });

    status.stop();
    t.done();

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