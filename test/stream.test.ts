import prompts from 'prompts';
import { Server } from './util/ws';
import axios from 'axios';
import { setup, teardown } from './util/setup';
import Wapp from '../src/wapp.serve';

function sendMessage(server: Server, msg: Record<string, any>): void {
  const tmp = msg;

  tmp.meta = {
    id: Math.random().toString(36).substring(7),
  };

  server.send(JSON.stringify(tmp));
}

function sendData(
  server: Server,
  type: string,
  data: Record<string, any>,
  parameters: Record<string, any> = {}
): void {
  const tmp = data;
  if (typeof tmp !== 'string') {
    tmp.meta = {
      id: `${type}_id`,
    };
  }
  const msg: Record<string, any> = {
    data: tmp,
    event: 'update',
    meta_object: {
      type,
    },
  };

  Object.keys(parameters).forEach((key) => {
    msg[key] = parameters[key];
  });

  sendMessage(server, msg);
}

function sendBody(
  server: Server,
  type: string,
  data: Record<string, any>,
  body: Record<string, any>
): void {
  const tmp = data;
  tmp.body = JSON.stringify(body);

  sendData(server, type, tmp);
}

describe('stream', () => {
  let mockedAxios: jest.Mocked<typeof axios>;
  let serverUser: Server;
  let serverWapp: Server;
  //let mockServer: any;

  afterEach(() => {
    teardown();
  });

  beforeEach(async () => {
    mockedAxios = await setup();

    serverUser = new Server(
      'wss://wappsto.com/services/2.1/websocket/open?x-session=session&subscription=[/notification,/installation]'
    );
    serverWapp = new Server(
      'wss://wappsto.com/services/2.1/websocket/open?x-session=session&subscription=[/extsync,/console]'
    );
  });

  it('can open stream', async () => {
    const w = new Wapp();
    w.openStream();

    await serverUser.connected;
    await serverWapp.connected;
  });

  it('can handle invalid stream data', async () => {
    const org = console.log;
    console.log = jest.fn();

    const w = new Wapp();
    w.openStream();

    await serverUser.connected;
    await serverWapp.connected;

    serverUser.send('{}');
    serverUser.send();
    serverUser.send('');
    serverUser.send('invalid');

    expect(console.log).toHaveBeenCalledTimes(0);
    console.log = org;
  });

  it('can handle stream errors', async () => {
    const org = console.log;
    console.log = jest.fn();

    const w = new Wapp();
    w.openStream();

    await serverUser.connected;
    await serverWapp.connected;

    serverUser.error('wrong');

    expect(console.log).toHaveBeenCalledTimes(0);
    console.log = org;
  });

  it('can handle stream close', async () => {
    const w = new Wapp();
    w.openStream();

    await serverUser.connected;
    await serverWapp.connected;

    serverUser.close(1000, 'test error');

    await serverUser.connected;
  });

  it('can handle console messages', async () => {
    const wapp = new Wapp();
    await wapp.openStream();

    await serverUser.connected;

    sendData(serverUser, 'console', {});
    sendData(serverUser, 'console', {}, { type: 'warn', timestamp: 'now' });
    sendData(serverUser, 'console', {}, { type: 'error', timestamp: 'now' });
    sendData(
      serverUser,
      'console',
      {},
      { type: 'error', extra: { output: 'extra' } }
    );
  });

  it('does nothing with state', async () => {
    const wapp = new Wapp();
    await wapp.openStream();

    await serverUser.connected;

    sendData(serverUser, 'state', {});
  });

  it('can handle installation', async () => {
    const wapp = new Wapp();
    await wapp.openStream();

    await serverUser.connected;

    sendData(serverUser, 'installation', { application: 'wrong' });
    sendData(serverUser, 'installation', { application: 'application_id' });
  });

  it('can handle extsync', async () => {
    const wapp = new Wapp();
    await wapp.openStream();

    await serverUser.connected;

    sendBody(serverUser, 'extsync', { uri: 'extsync' }, {});

    sendBody(
      serverUser,
      'extsync',
      {
        uri: 'extsync/wappsto/editor/console',
      },
      {
        time: '2021-01-01 10:12:14',
        arguments: {
          test: 'value',
          array: ['test', 'test'],
          obj: {
            test: 'test',
          },
        },
      }
    );

    sendBody(
      serverUser,
      'extsync',
      {
        uri: 'extsync/wappsto/editor/console',
      },
      {
        time: '2021-01-01 10:12:14',
        key: 'log',
        arguments: {
          array: ['test', 'test'],
          obj: {
            test: 'test',
          },
        },
      }
    );

    sendBody(
      serverUser,
      'extsync',
      {
        uri: 'extsync/wappsto/editor/console',
      },
      {
        time: '2021-01-01 10:12:14',
        key: 'error',
        arguments: {
          array: ['test', 'test'],
          obj: {
            test: 'test',
          },
        },
      }
    );

    expect(mockedAxios.get).toHaveBeenCalledTimes(0);
    expect(mockedAxios.post).toHaveBeenCalledTimes(0);
    expect(mockedAxios.patch).toHaveBeenCalledTimes(0);
  });

  it('can handle notifications', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: [],
    });
    mockedAxios.patch.mockResolvedValue({
      data: {},
    });

    const wapp = new Wapp();
    await wapp.openStream();

    await serverUser.connected;

    sendData(serverUser, 'notification', {
      read: 'unread',
      base: {
        code: 1100028,
      },
      custom: {
        code: 1299999,
        description: 'Test message',
      },
    });

    sendData(serverUser, 'notification', {
      read: 'unread',
      base: {
        code: 1100028,
      },
      custom: {
        code: 1,
        description: 'Test message',
      },
    });

    sendData(serverUser, 'notification', {
      read: 'unread',
      timestamp: '123',
      base: {
        code: 1100002,
        from: 'wrong',
      },
      custom: {
        description: 'Test message',
      },
    });

    sendData(serverUser, 'notification', {
      read: 'unread',
      timestamp: '321',
      base: {
        code: 1100003,
        from: 'installation_id',
      },
      custom: {
        description: 'Test message',
      },
    });

    sendData(serverUser, 'notification', {
      read: 'unread',
      timestamp: '321',
      base: {
        code: 1100003,
        from: 'installation_id',
      },
      custom: {
        description: 'Test message',
      },
    });

    sendData(serverUser, 'notification', {
      read: 'unread',
      base: {
        code: 1100006,
      },
    });

    sendData(serverUser, 'notification', {
      read: 'unread',
      base: {
        code: 1,
      },
    });

    sendData(serverUser, 'notification', {
      read: 'read',
      base: {
        code: 1,
      },
    });

    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.post).toHaveBeenCalledTimes(0);
    expect(mockedAxios.patch).toHaveBeenCalledTimes(5);

    expect(mockedAxios.get).toHaveBeenNthCalledWith(
      1,
      'https://wappsto.com/services/2.1/installation?expand=2&this_version_id=',
      {}
    );

    expect(mockedAxios.patch).toHaveBeenNthCalledWith(
      1,
      'https://wappsto.com/services/2.1/notification/notification_id',
      {
        meta: {
          id: 'notification_id',
        },
        read: 'read',
      },
      {}
    );
    expect(mockedAxios.patch).toHaveBeenNthCalledWith(
      2,
      'https://wappsto.com/services/2.1/notification/notification_id',
      {
        meta: {
          id: 'notification_id',
        },
        read: 'read',
      },
      {}
    );
    expect(mockedAxios.patch).toHaveBeenNthCalledWith(
      3,
      'https://wappsto.com/services/2.1/notification/notification_id',
      {
        meta: {
          id: 'notification_id',
        },
        read: 'read',
      },
      {}
    );
    expect(mockedAxios.patch).toHaveBeenNthCalledWith(
      4,
      'https://wappsto.com/services/2.1/notification/notification_id',
      {
        meta: {
          id: 'notification_id',
        },
        read: 'read',
      },
      {}
    );
    expect(mockedAxios.patch).toHaveBeenNthCalledWith(
      5,
      'https://wappsto.com/services/2.1/notification/notification_id',
      {
        meta: {
          id: 'notification_id',
        },
        read: 'read',
      },
      {}
    );
  });

  it('can handle notification req limitation', async () => {
    const wapp = new Wapp();
    await wapp.openStream();

    prompts.inject([['network_id']]);

    sendData(serverUser, 'notification', {
      read: 'unread',
      timestamp: '1234',
      base: {
        code: 1100003,
        from: 'installation_id',
      },
      custom: {
        type: 'network',
        method: ['POST'],
        quantity: 2,
        limitation: {
          name: {
            name: ['test'],
          },
        },
        description: 'Test message',
      },
    });

    sendData(serverUser, 'notification', {
      read: 'unread',
      timestamp: '12345',
      base: {
        code: 1100003,
        from: 'installation_id',
      },
      custom: {
        type: 'network',
        method: ['POST'],
        quantity: 2,
        limitation: {
          name: {
            name: ['wrong'],
          },
        },
        description: 'Test message',
      },
    });

    expect(mockedAxios.get).toHaveBeenCalledTimes(0);
    expect(mockedAxios.post).toHaveBeenCalledTimes(0);
    expect(mockedAxios.patch).toHaveBeenCalledTimes(0);
  });
  /*
  test('stream notification req collection', async () => {
    const wapp = new Wapp();
    await wapp.openStream();

    prompts.inject([{}, true, true]);

    sendData(serverUser, 'notification', {
      read: 'unread',
      timestamp: '123456',
      base: {
        code: 1100003,
        from: 'installation_id',
      },
      custom: {
        type: 'test',
        method: ['POST'],
        quantity: 2,
        collection: {},
      },
    });

    sendData(serverUser, 'notification', {
      read: 'unread',
      timestamp: '1234567',
      base: {
        code: 1100003,
        from: 'installation_id',
      },
      custom: {
        type: 'test',
        method: ['add'],
        quantity: 2,
        collection: {},
      },
    });

    sendData(serverUser, 'notification', {
      read: 'unread',
      timestamp: '1234568',
      base: {
        code: 1100003,
        from: 'installation_id',
      },
      custom: {
        type: 'test',
        method: ['wrong'],
        quantity: 2,
        collection: {},
      },
    });
  });

  test('stream notification req name installation', async () => {
    const wapp = new Wapp();
    await wapp.openStream();

    prompts.inject([{}, true, true]);

    sendData(serverUser, 'notification', {
      read: 'unread',
      timestamp: '1234567',
      base: {
        code: 1100003,
        from: 'installation_id',
      },
      custom: {
        type: 'test',
        name_installation: 'Test App',
      },
    });

    sendData(serverUser, 'notification', {
        read: 'unread',
        timestamp: '1234568',
        base: {
            code: 1100003,
            from: 'installation_id',
        },
        custom: {
            type: 'test',
            name_installation: 'Test App',
            collection: 'Test Type',
        },
    });

    sendData(serverUser, 'notification', {
      read: 'unread',
      timestamp: '1234569',
      base: {
        code: 1100003,
        from: 'installation_id',
      },
      custom: {
        type: 'test',
        name_installation: 'Test App',
        message: 'Test message',
      },
    });
  });
*/
});
