import HTTP from './util/http';
import Config from './config';
import tui from './util/tui';
import { getFilePath } from './util/helpers';
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
    [k: string]: unknown;
  } = {};

  file: any[] = [];
  parent?: Model;

  constructor(data?: any, parent?: Model) {
    super('version');
    this.parse(data);
    this.file = [];
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
    ];
  }

  async get(): Promise<any> {
    try {
      const response = await HTTP.get(
        `${this.HOST}/${this.id}?expand=2&verbose=true`
      );
      return new Version(response.data);
    } catch (err) {
      tui.showError(`Failed to get version: ${this.id}`, err);
    }
    return null;
  }

  findFile(filePath: string): any {
    return this.file.find(
      (file) => filePath === `${getFilePath(file.use)}/${file.name}`
    );
  }

  async update(version: any): Promise<boolean> {
    let result = true;
    try {
      const tmp = version;
      delete tmp.barebone;
      delete tmp.barebone_version;
      await HTTP.patch(`${this.HOST}/${this.id}`, tmp);
    } catch (err) {
      tui.showError(`Failed to update version: ${this.id}`, err);
      result = false;
    }
    return result;
  }

  updateFile(filePath: string, newFile: string): void {
    for (let i = 0; i < this.file.length; i += 1) {
      if (
        filePath === `${getFilePath(this.file[i].use)}/${this.file[i].name}`
      ) {
        this.file[i] = newFile;
        this.parent?.save();
        return;
      }
    }
  }
}
