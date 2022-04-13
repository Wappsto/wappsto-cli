import WebSocket from 'ws';
import Config from './config.js';
import tui from './tui.js';

export default class Stream {
  reconnectInterval = 10 * 1000;

  constructor(wappsto, callback, subs, session) {
    const arrHost = Config.host().split('//');
    arrHost.pop();
    this.wappsto = wappsto;
    this.subs = subs;
    this.host = arrHost.pop();
    this.callback = callback;
    this.session = session || this.wappsto.session.get();
    this.url = `wss://${this.host}/services/2.1/websocket/open?x-session=${this.session}`;
    this.sock = undefined;
  }

  subscribe() {
    this.subs.forEach((s) => {
      const msg = {
        jsonrpc: '2.0',
        method: 'POST',
        id: Math.floor(Math.random() * 100000),
        params: {
          url: '/services/2.1/websocket/open/subscription',
          data: s,
        },
      };
      this.sock.send(JSON.stringify(msg));
    });
  }

  open() {
    const connect = () => {
      this.sock = new WebSocket(this.url, {
        origin: `https://${this.host}`,
      });

      this.sock.on('close', (code, msg) => {
        switch (code) {
          case 1000:
            setTimeout(connect, 1);
            break;
          case 1006:
            break;
          default:
            tui.showError(`Stream closed: ${msg} (${code})`);
            setTimeout(connect, this.reconnectInterval);
        }
      });

      this.sock.on('error', (err) => {
        tui.showError('Stream error: ', err);
      });

      this.sock.on('message', (message) => {
        this.parseStreamEvent(message);
      });

      this.sock.on('open', () => {
        this.subscribe();
      });
    };
    connect();
  }

  close() {
    if (this.sock && this.sock.readyState === 1) {
      this.sock.close();
    }
    this.sock = undefined;
  }

  async parseStreamEvent(message) {
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
          this.callback({
            application: data.application,
            status: 'Installation Updated',
            session: true,
          });
          break;
        case 'extsync':
          try {
            if (data.uri !== 'extsync/wappsto/editor/console') {
              this.callback({
                log: data.body,
                type: 'ExtSync IN',
                timestamp: new Date().toLocaleTimeString(),
              });
            } else {
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
              this.callback(eventMsg);
            }
          } catch (err) {
            /* istanbul ignore next */
            tui.showError(err);
            /* istanbul ignore next */
            this.callback(data.body);
          }
          break;
        case 'notification':
          if (data.read === 'unread') {
            let readNotification = true;
            switch (data.base.code) {
              case 1100028:
                if (data.custom.code === 1299999) {
                  this.callback({ reinstall: true, log: data.custom.description });
                } else {
                  this.callback({ status: data.custom.description });
                }
                break;
              case 1100031:
              case 1100002:
              case 1100003:
                if (this.last_permission_request !== data.timestamp) {
                  this.last_permission_request = data.timestamp;
                  readNotification = false;

                  this.callback({
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
                this.callback(data);
            }

            if (readNotification) {
              await this.wappsto.readNotification(data.meta.id);
            }
          }
          break;
        case 'console':
          if (event.type === 'error') {
            this.callback({
              error: event.data,
              type: 'Background',
              timestamp: event.timestamp,
            });
            break;
          }
        // falls through
        default:
          this.callback(data);
      }
    } catch (err) {
      /* istanbul ignore next */
      tui.showError('Failed to handle stream event', err);
    }
  }
}
