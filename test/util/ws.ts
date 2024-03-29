import { EventEmitter } from 'events';

const CONNECTING = 0;
const OPENED = 1;
const CLOSED = 3;

const servers: Record<string, Server> = {};

export class Server extends EventEmitter {
  connections: Client[];
  connected?: null | (() => void);

  constructor(host: string) {
    super();
    this.connections = [];
    servers[host] = this;
  }

  addConnection(ws: Client) {
    ws.open();
    this.connections.push(ws);
    if (this.connected) {
      this.connected();
    }
    this.connected = null;
  }

  clearConnections() {
    this.connections.length = 0;
  }

  async connection() {
    return new Promise<void>((resolve) => {
      if (this.connections.length === 0) {
        this.connected = resolve;
      } else {
        resolve();
      }
    });
  }

  error(err?: string) {
    this.connections.forEach((conn: Client) => {
      conn.error(err || 'Unknown Error');
    });
  }

  send(msg?: string) {
    this.connections.forEach((conn: Client) => {
      conn.send(msg);
    });
  }

  close(code: number, msg?: string) {
    this.connections.forEach((conn: Client) => {
      conn.close(code, msg);
    });
    this.clearConnections();
  }
}

export class Client extends EventEmitter {
  readyState: number;

  constructor(host: string) {
    super();
    this.readyState = CONNECTING;

    if (servers[host]) {
      servers[host].addConnection(this);
    }
  }

  send(msg?: string) {
    this.emit('message', msg);
  }

  close(code: number, msg?: string) {
    this.readyState = CLOSED;
    this.emit('close', code, msg);
  }

  open() {
    this.readyState = OPENED;
  }

  error(err: string) {
    this.readyState = CLOSED;
    this.emit('error', err);
  }

  closeConnection() {
    this.close(0, 'close');
  }
}
