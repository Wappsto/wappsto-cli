import Model from './model';
import HTTP from './http';

export default class Session extends Model {
  session?: string;

  constructor() {
    super('session');
  }

  async login(user: string, pass: string): Promise<void> {
    const response = await HTTP.post(this.HOST, {
      username: user,
      password: pass,
      remember_me: true,
    });
    this.set(response.data.meta.id);
  }

  get(): string | false {
    return this.session || false;
  }

  clear(): void {
    super.clear();
    HTTP.removeHeader('x-session');
  }

  toJSON(): any {
    return this.session;
  }

  parse(data: any) {
    if(data) {
      this.session = data.toString().trim();
      HTTP.setHeader('x-session', this.session || '');
    }
  }

  set(session: string): void {
    this.parse(session);
    this.save();
  }

  setXSession(): boolean {
    super.load();
    return !!this.session;
  }

  async validate(): Promise<boolean> {
    if (this.setXSession() && (await this.fetch())) {
      return true;
    }
    this.clear();
    return false;
  }
}
