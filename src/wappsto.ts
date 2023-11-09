import { AxiosError } from 'axios';
import Config from './config';
import Session from './session';
import { JsonObjType } from './types/custom';
import HTTP from './util/http';
import questions from './util/questions';
import tui from './util/tui';

export default class Wappsto {
  HOST: string;
  session: Session;

  constructor() {
    this.HOST = Config.host();
    this.session = new Session();
  }

  async login(): Promise<void> {
    const validSession = await this.session.validate();

    if (validSession) {
      return;
    }

    const credentials = await questions.askWappstoCredentials(
      Config.isCustomHost() ? this.HOST : 'Wappsto'
    );

    if (credentials === false) {
      return;
    }

    try {
      await this.session.login(credentials.username, credentials.password);
    } catch (err) {
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
        `${this.HOST}/services/2.1/acl?propagate=true&id=[${id}]`,
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
    } catch (err) {
      switch ((err as AxiosError<JsonObjType>).response?.data.code) {
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
        `${this.HOST}/services/2.1/acl/${id}/permission/${id}`
      );
      const aclRestriction = aclResponse.data.installation;

      if (aclRestriction[0].create.includes(collection)) {
        return;
      }
      // Append the new service to the acl restriction for the installation
      aclRestriction[0].create.push(collection);
      await HTTP.patch(
        `${this.HOST}/services/2.1/acl/${id}/permission/${id}?propagate=true`,
        { restriction: aclRestriction }
      );
    } catch (err) {
      tui.showError('Failed to update ACL Restriction', err);
    }
  }

  async updateACLAccess(
    modelID: string,
    installationID: string
  ): Promise<void> {
    try {
      // Append the new user to the acl restriction for the item
      await HTTP.patch(
        `${this.HOST}/services/2.1/acl?id=${modelID}&propagate=true`,
        {
          permission: [
            {
              meta: { id: installationID },
              restriction: [{ method: { retrieve: true } }],
            },
          ],
        }
      );
    } catch (err) {
      tui.showError('Failed to update ACL Access', err);
    }
  }

  async find(
    type: string,
    search: string,
    method: string | string[],
    quantity: string | number,
    notShared: string
  ): Promise<JsonObjType[]> {
    let result = [];
    if (Array.isArray(method)) {
      method = method.join(',');
    }
    try {
      const url = `${type}?expand=0&${search}&method=[${method}]&quantity=${quantity}&not_shared_with=${notShared}`;
      const response = await HTTP.get(`${this.HOST}/services/${url}`);
      result = response.data;
      let last = result[result.length - 1];

      if (typeof last === 'string') {
        let offset = 100;
        result = result.filter(
          (item: JsonObjType | string) => typeof item !== 'string'
        );
        while (typeof last === 'string') {
          const next = await HTTP.get(
            `${this.HOST}/services/${url}&offset=${offset}`
          );
          result.concat(
            next.data.filter(
              (item: JsonObjType | string) => typeof item !== 'string'
            )
          );
          offset += 100;
          last = next.data[next.data.length - 1];
        }
      }
    } catch (err) {
      tui.showError('Failed to find', err as AxiosError);
    }
    return result;
  }

  async readNotification(id?: string, status = 'read'): Promise<void> {
    if (!id) {
      return;
    }
    try {
      await HTTP.patch(`${this.HOST}/services/2.1/notification/${id}`, {
        meta: {
          id,
        },
        read: status,
      });
    } catch (err) {
      console.log('error', err);
      if ((err as AxiosError<JsonObjType>).response?.data?.code !== 9900147) {
        tui.showError('Failed to read notification', err);
      }
    }
  }

  async getModel(type: string, id: string): Promise<JsonObjType | undefined> {
    let result = undefined;
    try {
      const response = await HTTP.get(`${this.HOST}/services/${type}/${id}`);
      result = response.data;
    } catch (err) {
      tui.showError('Failed to get model', err);
    }
    return result;
  }
}
