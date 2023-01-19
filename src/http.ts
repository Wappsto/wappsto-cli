import axios from 'axios';
import tui from './tui';

export default class HTTP {
  static setHeader(name: string, value: string) {
    axios.defaults.headers.common[name] = value;
  }

  static removeHeader(name: string): void {
    delete axios.defaults.headers.common[name];
  }

  static async get(url: string, options: any = {}): Promise<any> {
    const res = await axios.get(url, options);
    tui.showVerbose('HTTP', `GET ${url}`, res.data);
    return res;
  }

  static async post(url: string, data: any, options: any = {}): Promise<any> {
    tui.showVerbose('HTTP', `POST ${url}`, data);
    return axios.post(url, data, options);
  }

  static async put(url: string, data: any, options: any = {}): Promise<any> {
    tui.showVerbose('HTTP', `PUT ${url}`, data);
    return axios.put(url, data, options);
  }

  static async patch(url: string, data: any, options: any = {}): Promise<any> {
    tui.showVerbose('HTTP', `PATCH ${url}`, data);
    return axios.patch(url, data, options);
  }

  static async delete(url: string, options: any = {}): Promise<any> {
    tui.showVerbose('HTTP', `DELETE ${url}`);
    return axios.delete(url, options);
  }
}
