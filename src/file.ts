import Model from './model';
import { File21 } from './types/application.d';

export default class File extends Model implements File21 {
  name: string = '';
  type?: string;

  constructor(data?: any) {
    super('file');
    this.parse(data);
  }

  getAttributes(): string[] {
    return ['name', 'type'];
  }
}
