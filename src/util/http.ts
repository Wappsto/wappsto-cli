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
    try {
      const res = await axios.get(url, options);
      tui.showTraffic('GET', url, {}, res.data);
      return res;
    } catch (err: any) {
      tui.showTraffic('GET', url, {}, err.response?.data);
      throw err;
    }
  }

  static async post(url: string, data: any, options: any = {}): Promise<any> {
    try {
      const res = await axios.post(url, data, options);
      tui.showTraffic('POST', url, data, res.data);
      return res;
    } catch (err: any) {
      tui.showTraffic('POST', url, data, err.response?.data);
      throw err;
    }
  }

  static async put(url: string, data: any, options: any = {}): Promise<any> {
    try {
      const res = await axios.put(url, data, options);
      tui.showTraffic('PUT', url, data, res.data);
      return res;
    } catch (err: any) {
      tui.showTraffic('PUT', url, data, err.response?.data);
      throw err;
    }
  }

  static async patch(url: string, data: any, options: any = {}): Promise<any> {
    try {
      const res = await axios.patch(url, data, options);
      tui.showTraffic('PATCH', url, data, res.data);
      return res;
    } catch (err: any) {
      tui.showTraffic('PATCH', url, data, err.response?.data);
      throw err;
    }
  }

  static async delete(url: string, options: any = {}): Promise<any> {
    try {
      const res = await axios.delete(url, options);
      tui.showTraffic('DELETE', url, {}, res.data);
      return res;
    } catch (err: any) {
      tui.showTraffic('DELETE', url, {}, err.response?.data);
      throw err;
    }
  }
}
