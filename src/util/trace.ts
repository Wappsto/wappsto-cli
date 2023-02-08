import * as Sentry from '@sentry/node';
import '@sentry/tracing';
import { VERSION } from './version';
import Config from '../config';
import Session from '../session';

let transaction: any;

export function startTrace(command: string) {
  if (process.env.NODE_ENV !== 'test') {
    Sentry.init({
      dsn: 'https://ef7592dc40c34510b9246633e453ef0e@sentry.iot.seluxit.com/124',

      // We recommend adjusting this value in production, or using tracesSampler
      // for finer control
      tracesSampleRate: 1.0,
      environment: Config.env(),
      release: `wappsto-cli@${VERSION}`,
    });

    transaction = Sentry.startTransaction({
      op: command,
      name: `Wappsto CLI - ${command}`,
    });
  }
  return transaction;
}

export function setUser(session: Session) {
  if (process.env.NODE_ENV !== 'test') {
    Sentry.setUser({
      id: session.user || 'unknown user',
    });
  }
}

export default class Trace {
  span?: Sentry.Span;

  constructor(name: string, description?: string, data?: any) {
    if (process.env.NODE_ENV !== 'test') {
      if (transaction) {
        this.span = transaction.startChild({
          op: name,
          description: description,
        });
        if (data) {
          this.span?.setData('data', data);
        }
      }
    }
  }

  ok() {
    if (this.span) {
      this.span.setStatus('ok');
    }
  }

  error(status: string | any) {
    if (this.span) {
      if (typeof status === 'string') {
        this.span.setStatus(status);
      } else if (status.response?.status) {
        this.span.setStatus(status.response.status);
      } else {
        this.span.setStatus('unknown');
      }
    }
  }

  done(status?: string | any) {
    if (this.span) {
      if (status) {
        this.error(status);
      } else {
        this.ok();
      }
      this.span.finish();
    }
  }
}
