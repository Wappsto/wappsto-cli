import WebSocket from 'ws';
import Config from './config';
import { JsonObjType, StreamCallbackEvent } from './types/custom';
import { Eventstream20 } from './types/eventstream';
import { Extsync21 } from './types/extsync';
import { Installation21 } from './types/installation';
import { Notification21 } from './types/notification';
import tui from './util/tui';
import Wappsto from './wappsto';

type CallbackType = (event: StreamCallbackEvent) => void;

export default class Stream {
  ws?: WebSocket | undefined;
  wappsto: Wappsto;
  subscription: string[];
  installation_id: string;
  remote = true;
  last_permission_request?: string;
  last_stream_event?: string;
  session: string;
  callback: CallbackType;

  constructor(
    wappsto: Wappsto,
    subscription: string[],
    callback: CallbackType,
    session?: string,
    installation_id?: string,
    remote?: boolean
  ) {
    this.wappsto = wappsto;
    this.session = session || '';
    this.callback = callback;
    this.subscription = subscription;
    this.installation_id = installation_id || '';
    this.remote = remote === undefined ? true : remote;
  }

  open(): void {
    let subStr = '';
    this.subscription.forEach((s) => {
      if (subStr !== '') {
        subStr += ',';
      }
      subStr += s;
    });
    subStr = `[${subStr}]`;
    const host = Config.host().split('//')[1];
    const ses = this.session || this.wappsto.session.id;
    const wss = `${Config.websocket()}/services/2.1/websocket/open?x-session=${ses}&subscription=${subStr}`;

    const reconnectInterval = 10 * 1000;
    const connect = () => {
      this.ws = new WebSocket(wss, {
        origin: `https://${host}`,
      });

      this.ws.on('close', (code: number, msg: string) => {
        switch (code) {
          case 1000:
            setTimeout(connect, 1);
            break;
          default:
            tui.showError(`Stream closed: ${msg} (${code})`);
            setTimeout(connect, reconnectInterval);
        }
      });

      this.ws.on('error', (err: JsonObjType) => {
        tui.showError(`Stream error`, err);
      });

      this.ws.on('message', (message: Eventstream20 | string) => {
        this.parseStreamEvent(message, this.callback);
      });
    };
    connect();
  }

  close() {
    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
    }
  }

  printConsoleMessage(data: Extsync21, callback: CallbackType) {
    if (!this.remote) {
      return;
    }

    const body = JSON.parse(data.body);
    let msg = '';
    const timestamp = new Date(body.time).toLocaleTimeString();

    Object.keys(body.arguments).forEach((key) => {
      if (typeof body.arguments[key] === 'string') {
        msg += `${body.arguments[key]} `;
      } else {
        msg += JSON.stringify(body.arguments[key]);
      }
    });

    const eventMsg: { [key: string]: string } = {
      type: 'Background',
      timestamp,
    };
    switch (body.key) {
      case 'log':
        eventMsg.log = msg;
        break;
      case 'error':
        eventMsg.error = msg;
        break;
      case 'warn':
        eventMsg.warn = msg;
        break;
      default:
        eventMsg.log = `Unknown Background Message '${body.key}' - ${msg}`;
    }
    callback(eventMsg);
  }

  async handleNotification(data: Notification21, callback: CallbackType) {
    if (data.read !== 'unread') {
      return;
    }

    if (this.installation_id && data.base.from !== this.installation_id) {
      return;
    }

    let readNotification = true;
    switch (data.base.code) {
      case 1100028:
        if (data.custom?.code === 1299999) {
          callback({ reinstall: true, log: data.custom.description });
        } else {
          callback({ status: data.custom?.description });
        }
        break;
      case 1100031:
      case 1100002:
      case 1100003:
        if (this.last_permission_request !== data.timestamp) {
          this.last_permission_request = data.timestamp;
          readNotification = false;

          callback({
            req: data.custom,
            action: data.base.action,
            installation: data.base.from,
            id: data.meta.id,
          });
        }
        break;
      case 1100006:
      case 1100004:
        break;
      case 1100011:
        callback({ status: `Notification: ${data.custom?.message}` });
        break;
      default:
        callback(data as StreamCallbackEvent);
    }

    if (readNotification) {
      await this.wappsto.readNotification(data.meta.id);
    }
  }

  async parseStreamEvent(
    message: Eventstream20 | string,
    callback: CallbackType
  ) {
    try {
      let event: Eventstream20;
      try {
        if (typeof message === 'string') {
          event = JSON.parse(message);
        } else {
          event = JSON.parse(message.toString());
        }
      } catch (err) {
        tui.showDebug('STREAM', 'Invalid stream message', message);
        return;
      }

      tui.showStream(event);

      if (!event.meta || !event.meta.id) {
        return;
      }

      if (this.last_stream_event === event.meta.id) {
        return;
      }
      this.last_stream_event = event.meta.id;

      if (event.event === 'delete') {
        return;
      }
      const { data } = event;

      tui.showVerbose(
        'STREAM',
        `Got a ${event.event} event for ${event.meta_object.type}`
      );

      const extsyncData = data as Extsync21;

      switch (event.meta_object.type) {
        case 'state':
          break;
        case 'installation':
          callback({
            application: (data as Installation21)?.application,
            status: 'Installation Updated',
            session: true,
          });
          break;
        case 'extsync':
          try {
            if (extsyncData?.uri !== 'extsync/wappsto/editor/console') {
              callback({
                log: extsyncData?.body,
                type: 'ExtSync IN',
                timestamp: new Date().toLocaleTimeString(),
              });
            } else {
              this.printConsoleMessage(extsyncData, callback);
            }
          } catch (err) {
            /* istanbul ignore next */
            tui.showError((err as Error).toString());
            /* istanbul ignore next */
            if (extsyncData?.body) {
              callback(extsyncData.body);
            }
          }
          break;
        case 'notification':
          if (data) {
            await this.handleNotification(data as Notification21, callback);
          }
          break;
        case 'console':
          if (event.type) {
            let msg: string;
            if (typeof data !== 'string') {
              msg = JSON.stringify(data);
            } else {
              msg = data;
            }
            if (event.extra && event.extra.output) {
              msg += `\n${event.extra.output}`;
            }
            const consoleEvent: StreamCallbackEvent = {
              type: 'Background',
              timestamp: event.timestamp,
            };
            consoleEvent[event.type] = msg;
            callback(consoleEvent);
            break;
          }
        // falls through
        default:
          if (data) {
            callback(data as JsonObjType);
          }
      }
    } catch (err) {
      /* istanbul ignore next */
      tui.showError('Failed to handle stream event', err);
    }
  }
}
