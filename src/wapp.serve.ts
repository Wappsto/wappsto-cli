import Stream from './stream';
import type {
  JsonObjType,
  Limitation,
  StreamCallbackEvent,
} from './types/custom';
import questions from './util/questions';
import tui from './util/tui';
import UpdateWapp from './wapp.update';

export default class ServeWapp extends UpdateWapp {
  wappStream?: Stream;
  userStream?: Stream;

  /* istanbul ignore next */
  async uploadFile(filePath: string): Promise<void> {
    const localVersion = this.application.getVersion();
    const localFile = localVersion.findFile(filePath);

    if (localFile) {
      await localFile.update();
      this.application.save();
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
      (event: StreamCallbackEvent) => {
        this.handleStreamEvent(event);
      }
    );

    this.userStream.open();

    this.wappStream = new Stream(
      this.wappsto,
      ['/extsync', '/console'],
      (event: StreamCallbackEvent) => {
        this.handleStreamEvent(event);
      },
      this.installation.session
    );

    this.wappStream.open();
  }

  async handleStreamEvent(data: StreamCallbackEvent): Promise<void> {
    if (data.application && data?.application !== this.application.id) {
      return;
    }

    if (data.installation && data?.installation !== this.installation.id) {
      return;
    }

    if (
      data.meta?.type === 'notification' &&
      data.base.from !== this.installation.id
    ) {
      return;
    }
    console.log(data);

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
    } else if (data.start) {
      if (this.remote) {
        tui.showMessage(data.start.toString());
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
        if (!data.req) {
          return;
        }
        tui.block();
        const opts: { title: string; value: string }[] = [];
        const search: string[] = [];
        if (data.req.new_limitation) {
          Object.keys(data.req.new_limitation).forEach((index) => {
            const arrLim = data.req?.new_limitation?.[index];
            arrLim?.forEach((lim: Limitation) => {
              search.push(
                `${lim.type}_${lim.attribute}${lim.comparator}[${lim.value.join(
                  ','
                )}]`
              );
            });
          });
          const items = await this.wappsto.find(
            data.req.type,
            search.join('&'),
            data.req.method,
            data.req.quantity || 1,
            this.installation.id
          );
          if (items.length) {
            items.forEach((item: JsonObjType) => {
              const name = item.meta?.name_by_user || item.name;
              opts.push({
                title: `${name} (${item.meta.id})`,
                value: item.meta.id,
              });
            });
            const results = [];
            const answers = await questions.permissionRequest(data.req, opts);
            if (answers === false) {
              /* istanbul ignore next */
              return;
            }

            // Updated the ACL with the selected items
            results.push(
              this.wappsto.updateACL(
                answers.permission,
                data.installation || '',
                [],
                data.req?.method || []
              )
            );

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
                  data.installation || '',
                  Array.isArray(data.req.collection)
                    ? data.req.collection[0]
                    : data.req.collection
                );
                break;
              case 'retrieve':
                await this.wappsto.updateACLAccess(
                  data.req.data?.[0].meta.id,
                  data.installation || ''
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
