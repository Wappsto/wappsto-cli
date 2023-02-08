import { createWriteStream, createReadStream } from 'fs';
import FormData from 'form-data';
import Model from './model';
import HTTP from './util/http';
import {
  createFolders,
  getFileTimeISO,
  saveFile,
  deleteFile,
} from './util/files';
import { getFileName, getFileUse, getFilePath } from './util/helpers';
import { Version21, File21 } from './types/application.d';

export default class File extends Model implements File21 {
  name: string = '';
  type?: string;
  parent: Version21;
  modified?: string;
  status: string = '';

  constructor(data: Record<string, any>, parent: Version21) {
    super('file');
    this.parse(data);
    this.parent = parent;
  }

  getAttributes(): string[] {
    return ['name', 'type', 'modified'];
  }

  compare(path: string): boolean {
    const type = getFileUse(path);

    return this.parent.used_files[type]?.includes(this.id) || false;
  }

  get use(): string {
    let use = '/tmp';
    ['foreground', 'background', 'icon', 'widget'].forEach((type) => {
      if (this.parent.used_files[type]?.includes(this.id)) {
        use = type;
      }
    });
    return use;
  }

  get path(): string {
    return `${getFilePath(this.use)}/${this.name}`;
  }

  syncModified(): void {
    const use = this.use;
    this.modified = getFileTimeISO(`${getFilePath(use)}/${this.name}`);
  }

  deleteLocal() {
    deleteFile(this.path);
  }

  async download(filePath?: string) {
    const response = await HTTP.get(`${this.HOST}/${this.id}`, {
      responseType: 'stream',
    });

    if (response && response.data) {
      return new Promise<void>((resolve, reject) => {
        const path = filePath || this.path;
        createFolders(path);

        const error = () => {
          reject();
        };

        const done = () => {
          this.syncModified();
          resolve();
        };

        if (response.data.pipe) {
          const writer = createWriteStream(path);
          response.data.pipe(writer);
          writer.on('finish', done);
          writer.on('error', error);
        } else {
          saveFile(path, response.data);
          done();
        }
      });
    }

    throw new Error(`Failed to download ${this.path} (${this.id})`);
  }

  static create = async (
    filePath: string,
    parent: Version21
  ): Promise<File | null> => {
    const m = parent as unknown as Model;

    const use: string = getFileUse(filePath);
    const name: string = getFileName(filePath);

    const data = new FormData();
    data.append(name, createReadStream(`${getFilePath(use)}/${name}`));

    try {
      const response = await HTTP.post(
        `${m.HOST}/file/${use}?verbose=true`,
        data,
        {
          headers: data.getHeaders(),
        }
      );
      return new File(response.data, parent);
    } catch (err: any) {
      this.handleException(`Failed to create File: ${name}`, err);
    }

    return null;
  };

  async update() {
    const data = new FormData();
    data.append(this.id, createReadStream(this.path));

    try {
      const response = await HTTP.put(
        `${this.HOST}/${this.id}?verbose=true`,
        data,
        {
          headers: data.getHeaders(),
        }
      );
      this.parse(response.data);
      return true;
    } catch (err: any) {
      this.handleException(`Failed to update File: ${this.name}`, err);
    }

    return false;
  }
}
