import { createReadStream, createWriteStream } from 'fs';
import { AxiosError } from 'axios';
import FormData from 'form-data';
import Model from './model';
import { File21, Version21 } from './types/application.d';
import { JsonObjType } from './types/custom';
import {
  createFolders,
  deleteFile,
  getFileTimeISO,
  saveFile,
} from './util/files';
import { getFileName, getFilePath, getFileUse } from './util/helpers';
import HTTP from './util/http';

export default class File extends Model implements File21 {
  name = '';
  type?: string;
  parent: Version21;
  modified?: string;
  status = '';

  constructor(data: JsonObjType, parent: Version21) {
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
    const response = await HTTP.get(`${this.url}`, {
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
        `${m.url}/file/${use}?verbose=true`,
        data,
        {
          headers: data.getHeaders(),
        }
      );
      return new File(response.data, parent);
    } catch (err: unknown) {
      this.handleException(
        `Failed to create File: ${filePath}`,
        err as AxiosError
      );
    }

    return null;
  };

  async update() {
    const data = new FormData();
    data.append(this.id, createReadStream(this.path));

    try {
      const response = await HTTP.put(`${this.url}?verbose=true`, data, {
        headers: data.getHeaders(),
      });
      this.parse(response.data);
      return true;
    } catch (err: unknown) {
      this.handleException(
        `Failed to update File: ${this.path}`,
        err as AxiosError
      );
    }

    return false;
  }
}
