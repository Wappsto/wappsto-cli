import HTTP from './util/http';
import Model from './model';
import File from './file';
import { Version21 } from './types/application.d';

export default class Version extends Model implements Version21 {
  name: string = '';
  author?: string;
  version_app?: string;
  supported_features?: ('foreground' | 'background' | 'widget')[];
  max_number_installation?: number;
  description?: {
    general?: string;
    foreground?: string;
    background?: string;
    widget?: string;
    version?: string;
  };
  status:
    | 'idle'
    | 'commit'
    | 'revision'
    | 'publish'
    | 'uncommit'
    | 'unpublish'
    | 'republish'
    | 'disable'
    | 'reenable'
    | 'duplicate'
    | 'pending'
    | 'uncommitted'
    | 'published'
    | 'not updated'
    | 'unpublished'
    | 'disabled' = 'idle';
  used_files: {
    foreground?: string[];
    background?: string[];
    icon?: string[];
    widget?: string[];
    [k: string]: string[] | undefined;
  } = {};
  permission?: {
    create?: string[];
    permit_to_send_email?: boolean;
    permit_to_send_sms?: boolean;
    [k: string]: unknown;
  };
  executable?: {
    engine?: 'node' | 'python';
    version?: string;
  };

  file: (File | string)[] = [];
  parent: Model;

  constructor(data: Record<string, any>, parent: Model) {
    super('version');
    this.parse(data);
    this.parent = parent;
  }

  getAttributes(): string[] {
    return [
      'name',
      'author',
      'version_app',
      'supported_features',
      'max_number_installation',
      'description',
      'status',
      'used_files',
      'file',
      'permission',
      'executable',
    ];
  }

  parse(data: Record<string, any>): void {
    const fileData = data.file;
    delete data.file;
    super.parse(data);
    if (this.supported_features?.includes('background') && !this.executable) {
      this.executable = {
        engine: 'node',
      };
    }
    if (fileData) {
      if (fileData.length > 0 && typeof fileData[0] !== 'string') {
        this.file = [];
        fileData.forEach((f: any) => {
          this.file.push(new File(f, this));
        });
      }
    }
  }

  toJSON(full: boolean = true): Record<string, any> {
    const data = super.toJSON(full);
    if (full) {
      data.file = [];
      this.file.forEach((file: File | string) => {
        if (typeof file !== 'string') {
          data.file.push(file.toJSON());
        }
      });
    } else {
      delete data.file;
    }
    return data;
  }

  async clone(): Promise<Version> {
    try {
      const response = await HTTP.get(`${this.url}?expand=2&verbose=true`);
      return new Version(response.data, this.parent);
    } catch (err) {
      this.handleException(`Failed to get version: ${this.id}`, err);
    }
    return new Version({ meta: { id: this.id } }, this.parent);
  }

  findFile(filePath: string): File | undefined {
    const files = this.getFiles();
    return files.find((f) => {
      return filePath === f.path;
    });
  }

  async createFile(filePath: string): Promise<File | null> {
    const f = await File.create(filePath, this);
    if (f) {
      this.file.push(f);
    }
    return f;
  }

  updateFile(filePath: string, newFile: string): void {
    /*for (let i = 0; i < this.file.length; i += 1) {
      if (
        filePath === `${getFilePath(this.file[i].use)}/${this.file[i].name}`
      ) {
        this.file[i] = newFile;
        this.parent?.save();
        return;
      }
    }*/
  }

  getFiles(): File[] {
    const files: File[] = [];
    this.file.forEach((file) => {
      if (typeof file !== 'string') {
        files.push(file);
      }
    });
    return files;
  }

  async publish(): Promise<boolean> {
    try {
      const response = await HTTP.patch(`${this.url}`, {
        status: 'commit',
      });
      this.parse(response.data);
      return true;
    } catch (err) {
      this.handleException(
        `Failed to update ${this.meta.type}: ${this.id}`,
        err
      );
    }
    return false;
  }

  async unpublish(): Promise<boolean> {
    try {
      const response = await HTTP.patch(`${this.url}`, {
        status: 'uncommit',
      });
      this.parse(response.data);
      return true;
    } catch (err) {
      this.handleException(
        `Failed to update ${this.meta.type}: ${this.id}`,
        err
      );
    }
    return false;
  }
}
