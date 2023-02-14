import HTTP from './util/http';
import Spinner from './util/spinner';
import tui from './util/tui';
import questions from './util/questions';
import Config from './config';
import Session from './session';

export default class Wappsto {
  HOST: string;
  session: Session;

  constructor() {
    this.HOST = Config.host();
    this.session = new Session();
  }

  async login(): Promise<void> {
    const status = new Spinner('Authenticating you');

    const validSession = await this.session.validate();
    status.stop();

    if (validSession) {
      return;
    }

    const creds = await questions.askWappstoCredentials(
      Config.isCustomHost() ? this.HOST : 'Wappsto'
    );

    if (creds === false) {
      return;
    }

    status.start();

    try {
      await this.session.login(creds.username, creds.password);
      status.stop();
    } catch (err) {
      status.stop();
      throw new Error('LoginError');
    }
  }

  async updateACL(
    id: string,
    addID: string,
    create: string[],
    method: string[]
  ): Promise<void> {
    try {
      const methods: { [key: string]: boolean } = {};
      method.forEach((m: string) => {
        methods[m] = true;
      });
      await HTTP.patch(
        `${this.HOST}/services/2.0/acl?propagate=true&id=[${id}]`,
        {
          permission: [
            {
              meta: {
                id: addID,
              },
              restriction: [
                {
                  create,
                  method: methods,
                },
              ],
            },
          ],
        }
      );
    } catch (err: any) {
      switch (err.response.data.code) {
        case 9900071:
          setTimeout(async () => {
            await this.updateACL(id, addID, create, method);
          }, 100);
          break;
        default:
          tui.showError('Failed to update ACL', err);
      }
    }
  }

  async updateACLRestriction(id: string, collection: string[]): Promise<void> {
    try {
      const aclResponse = await HTTP.get(
        `${this.HOST}/services/2.0/acl/${id}/permission/${id}`
      );
      const aclRestriction = aclResponse.data.installation;

      if (aclRestriction[0].create.includes(collection)) {
        return;
      }
      // Append the new service to the acl restriction for the installation
      aclRestriction[0].create.push(collection);
      await HTTP.patch(
        `${this.HOST}/services/2.0/acl/${id}/permission/${id}?propagate=true`,
        { restriction: aclRestriction }
      );
    } catch (err) {
      tui.showError('Failed to update ACL Restriction', err);
    }
  }

  async find(
    type: string,
    search: string,
    method: string,
    quantity: string,
    notShared: string
  ): Promise<Record<string, any>> {
    let result = {};
    try {
      const url = `${type}?expand=0&${search}&method=[${method}]&quantity=${quantity}&not_shared_with=${notShared}`;
      const response = await HTTP.get(`${this.HOST}/services/${url}`);
      result = response.data;
    } catch (err) {
      tui.showError('Failed to find', err);
    }
    return result;
  }

  async readNotification(id: string, status: string = 'read'): Promise<void> {
    try {
      await HTTP.patch(`${this.HOST}/services/2.0/notification/${id}`, {
        meta: {
          id,
        },
        read: status,
      });
    } catch (err: any) {
      if (
        !err.response ||
        !err.response.data ||
        err.response.data.code !== 9900147
      ) {
        tui.showError('Failed to read notification', err);
      }
    }
  }
}
