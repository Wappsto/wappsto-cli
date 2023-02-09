import Model from './model';
import HTTP from './util/http';
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

  toJSON(full: boolean = true): any {
    return this.id;
  }

  parse(data: any) {
    if (typeof data === 'string') {
      this.meta.id = data.toString().trim();
      HTTP.setHeader('x-session', this.id);
    } else {
      super.parse(data);
    }
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
