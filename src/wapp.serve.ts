import UpdateWapp from './wapp.update';
import Stream from './stream';
import tui from './util/tui';
import questions from './util/questions';

export default class ServeWapp extends UpdateWapp {
  wappStream?: Stream;
  userStream?: Stream;

  /* istanbul ignore next */
  async uploadFile(filePath: string): Promise<void> {
    const localVersion = this.application.getVersion();
    const localFile = localVersion.findFile(filePath);

    if (localFile) {
      await localFile.update();

      await this.installation.restart();

      tui.showMessage(`${filePath} was updated`);
    } else {
      tui.showVerbose(
        'WAPP',
        `${filePath} was changed but is not part of the version`
      );
    }
  }

  async openStream(): Promise<void> {
    this.userStream = new Stream(
      this.wappsto,
      ['/notification', '/installation'],
      (event: any) => {
        this.handleStreamEvent(event);
      }
    );

    this.userStream.open();

    this.wappStream = new Stream(
      this.wappsto,
      ['/extsync', '/console'],
      (event: any) => {
        this.handleStreamEvent(event);
      },
      this.installation.session
    );

    this.wappStream.open();
  }

  async handleStreamEvent(data: any): Promise<void> {
    if (data?.application && data?.application !== this.application.id) {
      return;
    }

    if (data?.installation && data?.installation !== this.installation.id) {
      return;
    }

    if (data.reinstall) {
      const oldSession = this.installation.session;
      const newSession = await this.getInstallationSession();
      if (oldSession !== newSession) {
        this.wappStream?.close();
        this.wappStream?.open();
      }
      if (data.log) {
        tui.showStatus(data.log);
      }
    } else if (data.log) {
      if (this.remote) {
        tui.showLog(data.log, data.type, data.timestamp);
      }
    } else if (data.error) {
      if (this.remote) {
        if (data.type === 'Background') {
          tui.showLog(data.error, data.type, data.timestamp, 'error');
        } else {
          tui.showError(data.error);
        }
      }
    } else if (data.warn) {
      if (this.remote) {
        if (data.type === 'Background') {
          tui.showLog(data.warn, data.type, data.timestamp, 'warn');
        } else {
          tui.showWarning(data.warn);
        }
      }
    } else if (data.status) {
      tui.showStatus(data.status);
      if (data.session) {
        await this.getInstallationSession();
      }
    } else if (data.req) {
      await this.mutex.runExclusive(async () => {
        tui.block();
        const opts: any[] = [];
        const search: string[] = [];
        if (data.req.limitation) {
          Object.keys(data.req.limitation).forEach((key) => {
            const lim = data.req.limitation[key];
            Object.keys(lim).forEach((type) => {
              search.push(`this_${type}=[${lim[type].join(',')}]`);
            });
          });
          const items = await this.wappsto.find(
            data.req.type,
            search.join('&'),
            data.req.method,
            data.req.quantity,
            this.installation.id
          );
          if (items.length) {
            items.forEach((item: any) => {
              opts.push({
                name: `${item.name} (${item.meta.id})`,
                value: item.meta.id,
              });
            });
            const results = [];
            const answers = await questions.permissionRequest(data.req, opts);
            if (answers === false) {
              /* istanbul ignore next */
              return;
            }

            answers.permission.forEach((per: string) => {
              results.push(
                this.wappsto.updateACL(
                  per,
                  data.installation,
                  [],
                  data.req.method
                )
              );
            });
            let status = 'read';
            if (answers.permission.length) {
              status = 'accepted';
            }
            results.push(this.wappsto.readNotification(data.id, status));

            await Promise.all(results);
          } else {
            tui.showWarning(
              `Failed to find anything matching the permission request from ${data.req.name_installation}`
            );
          }
        } else if (data.req.collection) {
          const answers = await questions.precisePermissionRequest(
            data.req,
            this.wappsto
          );
          if (answers === false) {
            /* istanbul ignore next */
            return;
          }

          if (answers.accept) {
            switch (data.req.method[0]) {
              case 'add': 
                await this.wappsto.updateACLRestriction(
                  data.installation,
                  data.req.collection
                );
                break;
              case 'retrieve':
                await this.wappsto.updateACLAccess(
                  data.req.data[0].meta.id,
                  data.installation
                );
                break;
              default:
                tui.showWarning(
                  `Unknown '${data.req.method[0]}' permission request`
                );
                break;
            }
            await this.wappsto.readNotification(data.id, 'accepted');
          } else {
            await this.wappsto.readNotification(data.id, 'denied');
          }
        } else if (data.req.name_installation) {
          const answers = await questions.precisePermissionRequest(
            data.req,
            this.wappsto
          );
          if (answers === false) {
            /* istanbul ignore next */
            return;
          }
          if (answers.accept) {
            await this.installation.setExtSync(true);
            await this.wappsto.readNotification(data.id, 'accepted');
          } else {
            await this.wappsto.readNotification(data.id, 'denied');
          }
        } else {
          tui.showError('Failed to handle request', data.req);
        }
        tui.unblock();
      });
    } else if (typeof data !== 'string') {
      tui.showMessage(JSON.stringify(data));
    } else {
      tui.showMessage(data);
    }
  }
}
