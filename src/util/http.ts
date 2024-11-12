import axios from 'axios';
import { JsonObjType } from '../types/custom';
import spinner from './spinner';
import tui from './tui';
import { VERSION } from './version';

type Methods = 'head' | 'options' | 'put' | 'post' | 'patch' | 'delete' | 'get';

export default class HTTP {
  constructor() {
    axios.defaults.headers.common['User-Agent'] =
      `Wappsto-cli/${VERSION} (axios/${axios.VERSION})`;
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
    data: JsonObjType = {},
    config?: JsonObjType
  ): Promise<JsonObjType> {
    try {
      let response;
      spinner.setMessage(tui.showTraffic(func, url, data, null) || '', false);
      if (config === undefined) {
        response = await axios[func](url, data);
      } else {
        response = await axios[func](url, data, config);
      }
      if (!response) {
        console.error('Failed to get response from', func, 'with', url);
      }
      tui.showTraffic(func, url, data, response.data);
      return response;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        tui.showTraffic(func, url, data, err.response?.data);
      }
      throw err;
    }
  }

  static async get(
    url: string,
    options: JsonObjType = {}
  ): Promise<JsonObjType> {
    return HTTP.wrap('get', url, options);
  }

  static async post(
    url: string,
    data: JsonObjType,
    options: JsonObjType = {}
  ): Promise<JsonObjType> {
    return HTTP.wrap('post', url, data, options);
  }

  static async put(
    url: string,
    data: JsonObjType,
    options: JsonObjType = {}
  ): Promise<JsonObjType> {
    return HTTP.wrap('put', url, data, options);
  }

  static async patch(
    url: string,
    data: JsonObjType,
    options: JsonObjType = {}
  ): Promise<JsonObjType> {
    return HTTP.wrap('patch', url, data, options);
  }

  static async delete(
    url: string,
    options: JsonObjType = {}
  ): Promise<JsonObjType> {
    return HTTP.wrap('delete', url, options);
  }
}
