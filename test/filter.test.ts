import axios from 'axios';
import prompts from 'prompts';
import { JsonObjType } from '../src/types/custom';
import { streamFilterEvent } from './util/response';
import { setup, teardown } from './util/setup';
import { Server } from './util/ws';
// eslint-disable-next-line import/order
import Wapp from '../src/wapp.serve';

function sendMessage(server: Server, msg: JsonObjType): void {
  const tmp = msg;

  tmp.meta = {
    id: Math.random().toString(36).substring(7),
  };

  server.send(JSON.stringify(tmp));
}

describe('stream', () => {
  let mockedAxios: jest.Mocked<typeof axios>;
  let serverUser: Server;
  //let mockServer: any;

  afterEach(() => {
    teardown();
  });

  beforeEach(async () => {
    mockedAxios = await setup();

    serverUser = new Server(
      'wss://wappsto.com/services/2.1/websocket/open?x-session=session&subscription=[/notification,/installation]'
    );
  });

  it('find using filter', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: ['network_id'] })
      .mockResolvedValueOnce({ data: [] });
    const wapp = new Wapp();
    await wapp.openStream();
    await wapp.init();

    wapp.installation.meta.id = '9cb430ae-a1f7-4191-aeed-c3363e80ec2c';
    prompts.inject([['network_id']]);

    sendMessage(serverUser, streamFilterEvent);

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockedAxios.get).toHaveBeenCalledTimes(3);
    expect(mockedAxios.post).toHaveBeenCalledTimes(0);
    expect(mockedAxios.patch).toHaveBeenCalledTimes(0);

    expect(mockedAxios.get).toHaveBeenNthCalledWith(
      2,
      'https://wappsto.com/services/device?expand=0&device_manufacturer!=[EMS Configurator]&value_type=[energy,total_energy,load_curve_energy]&method=[retrieve]&quantity=all&not_shared_with=9cb430ae-a1f7-4191-aeed-c3363e80ec2c',
      {}
    );
    expect(mockedAxios.get).toHaveBeenNthCalledWith(
      3,
      'https://wappsto.com/services/device?expand=0&device_manufacturer!=[EMS Configurator]&value_type=[energy,total_energy,load_curve_energy]&method=[retrieve]&quantity=all&not_shared_with=9cb430ae-a1f7-4191-aeed-c3363e80ec2c&offset=100',
      {}
    );
  });
});
