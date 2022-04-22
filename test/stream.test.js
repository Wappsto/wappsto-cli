import mockInquirer from 'mock-inquirer';
import readline from 'readline';
import WS from 'jest-websocket-mock';
import tui from '../lib/tui.js';
import Config from '../lib/config.js';
import { createFolders, saveJsonFile, deleteFolder } from '../lib/files.js';
import Wapp from '../lib/wapp.js';

function sendMessage(stream, msg) {
  const tmp = msg;

  tmp.meta = {
    id: Math.random().toString(36).substring(7),
  };

  stream.send(JSON.stringify(tmp));
}

function sendData(stream, type, data, parameters = {}) {
  const tmp = data;
  if (typeof tmp !== 'string') {
    tmp.meta = {
      id: `${type}_id`,
    };
  }
  const msg = {
    data: tmp,
    event: 'update',
    meta_object: {
      type,
    },
  };

  Object.keys(parameters).forEach((key) => {
    msg[key] = parameters[key];
  });

  sendMessage(stream, msg);
}

function sendBody(stream, type, data, body) {
  const tmp = data;
  tmp.body = JSON.stringify(body);

  sendData(stream, type, tmp);
}

describe('stream', () => {
  readline.cursorTo = () => {};
  readline.clearLine = () => {};
  let userServer;
  let wappServer;
  let wapp;

  beforeEach(() => {
    WS.clean();
    userServer = new WS('ws://localhost:12345');
    wappServer = new WS('ws://localhost:12346');

    createFolders(`${Config.cacheFolder()}/application`);
    saveJsonFile(`${Config.cacheFolder()}/application`, {
      version: [
        {
          meta: {
            id: 'version_id',
          },
        },
      ],
      meta: {
        id: 'application_id',
      },
    });

    saveJsonFile(`${Config.cacheFolder()}/installation`, {
      meta: {
        id: 'installation_id',
      },
    });

    tui.write = jest.fn();

    wapp = new Wapp();
    wapp.userStream.url = 'ws://localhost:12345';
    wapp.wappStream.url = 'ws://localhost:12346';
    wapp.openStream();
  });

  afterEach(() => {
    wapp.closeStream();
    deleteFolder(Config.cacheFolder());
  });

  test('stream console', async () => {
    await wappServer.connected;
    await userServer.connected;

    sendData(wappServer, 'console', {});
    sendData(wappServer, 'console', {}, { type: 'error', timestamp: 'now' });

    await new Promise((r) => { setTimeout(r, 1); });

    expect(tui.write).toHaveBeenCalledTimes(4);
  });

  test('stream invalid data', async () => {
    await wappServer.connected;
    await userServer.connected;

    wappServer.send({});
    expect(tui.write).toHaveBeenCalledTimes(0);

    wappServer.send('');
    expect(tui.write).toHaveBeenCalledTimes(0);

    wappServer.send('{}');
    expect(tui.write).toHaveBeenCalledTimes(0);

    wappServer.send('{"meta":{"id":"id"},"event":"delete"}');
    expect(tui.write).toHaveBeenCalledTimes(0);

    wappServer.send('{"meta":{"id":"id"}}');
    expect(tui.write).toHaveBeenCalledTimes(0);

    wappServer.send('asd');
    expect(tui.write).toHaveBeenCalledTimes(0);

    sendData(wappServer, 'wrong', {});
    expect(tui.write).toHaveBeenCalledTimes(2);

    sendData(wappServer, 'wrong', 'wrong');
    expect(tui.write).toHaveBeenCalledTimes(4);

    await new Promise((r) => { setTimeout(r, 1); });
  });

  test('stream state', async () => {
    await wappServer.connected;
    await userServer.connected;

    sendData(wappServer, 'state', {});

    expect(tui.write).toHaveBeenCalledTimes(0);

    await new Promise((r) => { setTimeout(r, 2); });
  });

  test('stream installation', async () => {
    await wappServer.connected;
    await userServer.connected;

    sendData(wappServer, 'installation', { application: 'wrong' });
    sendData(wappServer, 'installation', { application: 'application_id' });

    expect(tui.write).toHaveBeenCalledTimes(1);

    await new Promise((r) => { setTimeout(r, 2); });
  });

  describe('extsync', () => {
    test('empty', async () => {
      await wappServer.connected;
      await userServer.connected;

      sendBody(wappServer, 'extsync', { uri: 'extsync' }, {});
      expect(tui.write).toHaveBeenCalledWith(expect.stringContaining('ExtSync IN'));
      expect(tui.write).toHaveBeenCalledTimes(2);
    });

    test('invalid', async () => {
      await wappServer.connected;
      await userServer.connected;

      sendBody(
        wappServer,
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
        },
      );
      expect(tui.write).toHaveBeenCalledWith(expect.stringContaining('Unknown Background Message \'undefined\''));
      expect(tui.write).toHaveBeenCalledTimes(2);
    });

    test('log', async () => {
      await wappServer.connected;
      await userServer.connected;

      sendBody(
        wappServer,
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
        },
      );
      expect(tui.write).toHaveBeenCalledWith(expect.stringContaining('["test","test"]{"test":"test"}'));
      expect(tui.write).toHaveBeenCalledTimes(2);
    });

    test('error', async () => {
      await wappServer.connected;
      await userServer.connected;

      sendBody(
        wappServer,
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
        },
      );

      expect(tui.write).toHaveBeenCalledWith(expect.stringContaining('["test","test"]{"test":"test"}'));
      expect(tui.write).toHaveBeenCalledTimes(2);
    });
  });

  describe('notification', () => {
    test('unknown', async () => {
      await wappServer.connected;
      await userServer.connected;

      sendData(wappServer, 'notification', {
        read: 'unread',
        base: {
          code: 1100028,
        },
        custom: {
          code: 1299999,
          description: 'Test message',
        },
      });
      expect(tui.write).toHaveBeenCalledTimes(0);
    });

    test('log', async () => {
      await wappServer.connected;
      await userServer.connected;

      sendData(wappServer, 'notification', {
        read: 'unread',
        base: {
          code: 1100028,
        },
        custom: {
          code: 1,
          description: 'Test message',
        },
      });

      expect(tui.write).toHaveBeenCalledWith(expect.stringContaining('Test message'));
      expect(tui.write).toHaveBeenCalledTimes(1);
    });

    test('wrong', async () => {
      await wappServer.connected;
      await userServer.connected;

      sendData(wappServer, 'notification', {
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

      expect(tui.write).toHaveBeenCalledTimes(0);
    });

    test('installation', async () => {
      await wappServer.connected;
      await userServer.connected;

      sendData(wappServer, 'notification', {
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

      sendData(wappServer, 'notification', {
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

      expect(tui.write).toHaveBeenCalledTimes(0);
    });

    test('1100006', async () => {
      await wappServer.connected;
      await userServer.connected;

      sendData(wappServer, 'notification', {
        read: 'unread',
        base: {
          code: 1100006,
        },
      });

      expect(tui.write).toHaveBeenCalledTimes(0);
    });

    test('empty unread', async () => {
      await wappServer.connected;
      await userServer.connected;

      sendData(wappServer, 'notification', {
        read: 'unread',
        base: {
          code: 1,
        },
      });

      expect(tui.write).toHaveBeenCalledWith(expect.stringContaining('{"read":"unread","base":{"code":1},"meta":{"id":"notification_id"}}'));
      expect(tui.write).toHaveBeenCalledTimes(2);
    });

    test('empty read', async () => {
      await wappServer.connected;
      await userServer.connected;

      sendData(wappServer, 'notification', {
        read: 'read',
        base: {
          code: 1,
        },
      });

      expect(tui.write).toHaveBeenCalledTimes(0);
    });

    describe('request', () => {
      test('limitation', async () => {
        await wappServer.connected;
        await userServer.connected;

        mockInquirer([
          {
            permission: ['network_id'],
          },
        ]);

        sendData(wappServer, 'notification', {
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

        sendData(wappServer, 'notification', {
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

        expect(tui.write).toHaveBeenCalledTimes(0);
      });

      test('collection', async () => {
        await wappServer.connected;
        await userServer.connected;

        mockInquirer([
          {},
          {
            accept: true,
          },
          {
            accept: true,
          },
        ]);

        sendData(wappServer, 'notification', {
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

        sendData(wappServer, 'notification', {
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

        sendData(wappServer, 'notification', {
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
        expect(tui.write).toHaveBeenCalledTimes(0);
      });

      test('name installation', async () => {
        await wappServer.connected;
        await userServer.connected;

        mockInquirer([
          {},
          {
            accept: true,
          },
          {
            accept: true,
          },
        ]);

        sendData(wappServer, 'notification', {
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
        /*
          sendData(wappServer, 'notification', {
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
      */

        sendData(wappServer, 'notification', {
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

        expect(tui.write).toHaveBeenCalledTimes(0);
      });
    });
  });

  test('stream close', async () => {
    wapp.wappStream.reconnectInterval = 1;
    await wappServer.connected;
    await userServer.connected;

    wappServer.close();

    expect(tui.write).toHaveBeenCalledWith(expect.stringContaining('Stream closed'));
    expect(tui.write).toHaveBeenCalledTimes(1);

    await wappServer.connected;

    expect(tui.write).toHaveBeenCalledTimes(1);

    await new Promise((r) => { setTimeout(r, 2); });
  });

  test('stream error', async () => {
    wapp.wappStream.reconnectInterval = 1;
    await wappServer.connected;
    await userServer.connected;

    wappServer.error();

    await new Promise((r) => { setTimeout(r, 1); });

    expect(tui.write).toHaveBeenCalledWith(expect.stringContaining('Stream error'));
    expect(tui.write).toHaveBeenCalledWith(expect.stringContaining('Stream closed'));
    expect(tui.write).toHaveBeenCalledTimes(5);

    await wappServer.connected;

    expect(tui.write).toHaveBeenCalledTimes(5);

    await new Promise((r) => { setTimeout(r, 1); });
  });
});
