import HTTP from './util/http';
import tui from './util/tui';
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

  file: (File | string)[] = [];
  parent: Model;

  constructor(data: any, parent: Model) {
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
    ];
  }

  parse(data: any): void {
    this.trace('parse', data);
    super.parse(data);
    const files = this.file || [];
    this.file = [];
    files.forEach((f: any) => {
      this.file.push(new File(f, this));
    });
  }

  toJSON(): any {
    this.trace('toJSON', this);
    const data = super.toJSON();
    data.file = [];
    this.file.forEach((file: File | string) => {
      if (typeof file !== 'string') {
        data.file.push(file.toJSON());
      }
    });
    return data;
  }

  async get(): Promise<any> {
    try {
      const response = await HTTP.get(
        `${this.HOST}/${this.id}?expand=2&verbose=true`
      );
      return new Version(response.data, this.parent);
    } catch (err) {
      tui.showError(`Failed to get version: ${this.id}`, err);
    }
    return null;
  }

  findFile(filePath: string): File | undefined {
    const files = this.getFiles();
    return files.find((f) => {
      return filePath === f.path;
    });
  }

  async createFile(filePath: string) {
    return await File.create(filePath, this);
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
}
