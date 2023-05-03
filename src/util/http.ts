import axios from 'axios';
import tui from './tui';
import Trace from './trace';
import { VERSION } from './version';

type Methods = 'head' | 'options' | 'put' | 'post' | 'patch' | 'delete' | 'get';

export default class HTTP {
  constructor() {
    axios.defaults.headers.common[
      'User-Agent'
    ] = `Wappsto-cli/${VERSION} (axios/${axios.VERSION})`;
  }

  static trace(method: string, url: string, data?: any): Trace {
    return new Trace(`HTTP ${method}`, url, data);
  }

  static setHeader(name: string, value: string) {
    axios.defaults.headers.common[name] = value;
  }

  static removeHeader(name: string): void {
    delete axios.defaults.headers.common[name];
  }

  static async wrap(
    func: Methods,
    url: string,
    data: any = {},
    config?: any
  ): Promise<any> {
    const t = HTTP.trace(func, url);
    try {
      let response;
      if (config === undefined) {
        response = await axios[func](url, data);
      } else {
        response = await axios[func](url, data, config);
      }

      tui.showTraffic(func, url, data, response.data);
      t.done();
      return response;
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        tui.showTraffic(func, url, data, err.response?.data);
      }
      t.done(err);
      throw err;
    }
  }

  static async get(url: string, options: any = {}): Promise<any> {
    return HTTP.wrap('get', url, options);
  }

  static async post(url: string, data: any, options: any = {}): Promise<any> {
    return HTTP.wrap('post', url, data, options);
  }

  static async put(url: string, data: any, options: any = {}): Promise<any> {
    return HTTP.wrap('put', url, data, options);
  }

  static async patch(url: string, data: any, options: any = {}): Promise<any> {
    return HTTP.wrap('patch', url, data, options);
  }

  static async delete(url: string, options: any = {}): Promise<any> {
    return HTTP.wrap('delete', url, options);
  }
}
