const WebSocket = require('ws');
const HTTP = require('./http');
const Config = require('./config');
const tui = require('./tui');

module.exports = class Stream {
  constructor(wappsto) {
    this.HOST = `${Config.host()}`;
    this.wappsto = wappsto;
  }

  async getAll(session) {
    let result = false;
    try {
      const response = await HTTP.get(`${this.HOST}/services/2.0/stream?expand=2`, {
        headers: {
          'x-session': session || this.wappsto.session.get(),
        },
      });

      result = response.data;
    } catch (err) {
      /* istanbul ignore next */
      tui.showError('Failed to get streams', err);
    }
    return result;
  }

  async create(subscription, session) {
    let result = {};
    try {
      const response = await HTTP.post(`${this.HOST}/services/2.0/stream`, {
        subscription,
      }, {
        headers: {
          'x-session': session || this.wappsto.session.get(),
        },
      });
      result = response.data;
    } catch (err) {
      /* istanbul ignore next */
      tui.showError(`Failed to create stream for ${subscription}`, err);
    }
    return result;
  }

  open(env, id, callback, session) {
    const host = env + this.HOST.split('//')[1];
    const ses = session || this.wappsto.session.get();
    const wss = `wss://${host}/services/2.1/websocket/${id}?x-session=${ses}`;
    const self = this;

    const reconnectInterval = 10 * 1000;
    let ws;
    const connect = function connect() {
      ws = new WebSocket(wss, {
        origin: `https://${host}`,
      });

      ws.on('close', (code, msg) => {
        switch (code) {
        case 1000:
          setTimeout(connect, 1);
          break;
        default:
          tui.showError(`Stream ${id} closed: ${msg} (${code})`);
          setTimeout(connect, reconnectInterval);
        }
      });

      ws.on('error', (err) => {
        tui.showError(`Stream error: ${id}`, err);
      });

      ws.on('message', (message) => {
        self.parseStreamEvent(message, callback);
      });
    };
    connect();

    return ws;
  }

  async parseStreamEvent(message, callback) {
    try {
      const event = JSON.parse(message);

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

      switch (event.meta_object.type) {
      case 'state':
        break;
      case 'installation':
        callback({ application: data.application, status: 'Installation Updated', session: true });
        break;
      case 'extsync':
        try {
          if (data.uri !== 'extsync/wappsto/editor/console') {
            callback({
              log: data.body,
              type: 'ExtSync IN',
              timestamp: new Date().toLocaleTimeString(),
            });
          } else {
            const body = JSON.parse(data.body);
            let msg = '';
            const timestamp = new Date(body.time).toLocaleTimeString();

            Object.keys(body.arguments).forEach((key) => {
              if (typeof (body.arguments[key]) === 'string') {
                msg += `${body.arguments[key]} `;
              } else {
                msg += JSON.stringify(body.arguments[key]);
              }
            });

            const eventMsg = {
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
        } catch (err) {
          /* istanbul ignore next */
          tui.showError(err);
          /* istanbul ignore next */
          callback(data.body);
        }
        break;
      case 'notification':
        if (data.read === 'unread') {
          let readNotification = true;
          switch (data.base.code) {
          case 1100028:
            if (data.custom.code === 1299999) {
              callback({ reinstall: true, log: data.custom.description });
            } else {
              callback({ status: data.custom.description });
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
          default:
            callback(data);
          }

          if (readNotification) {
            await this.wappsto.readNotification(data.meta.id);
          }
        }
        break;
      case 'console':
        if (event.type === 'error') {
          callback({ error: event.data, type: 'Background', timestamp: event.timestamp });
          break;
        }
        // falls through
      default:
        callback(data);
      }
    } catch (err) {
      /* istanbul ignore next */
      tui.showError('Failed to handle stream event', err);
    }
  }
};
