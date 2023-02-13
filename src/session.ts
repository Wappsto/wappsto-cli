import Model from './model';
import HTTP from './util/http';
//import { saveFile } from './util/files';
import { Session21 } from './types/session.d';

export default class Session extends Model implements Session21 {
  user?: string;

  constructor() {
    super('session');
    this.load();
  }

  public getAttributes(): string[] {
    return ['user'];
  }

  async login(user: string, pass: string): Promise<void> {
    const response = await HTTP.post(this.HOST, {
      username: user,
      password: pass,
      remember_me: true,
    });
    this.parse(response.data);
    this.save();
  }

  clear(): void {
    super.clear();
    HTTP.removeHeader('x-session');
  }

  parse(data: any) {
    if (typeof data === 'string') {
      this.meta.id = data.toString().trim();
    } else {
      super.parse(data);
    }
    HTTP.setHeader('x-session', this.id);
  }

  async validate(): Promise<boolean> {
    if (this.meta.id) {
      if (await this.fetch()) {
        return true;
      }
    }
    this.clear();
    return false;
  }
}
