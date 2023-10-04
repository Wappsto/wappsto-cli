import * as Sentry from '@sentry/node';
import '@sentry/tracing';
import { AxiosError } from 'axios';
import Config from '../config';
import Session from '../session';
import { JsonObjType } from '../types/custom';
import Spinner from './spinner';
import { VERSION } from './version';

/* istanbul ignore file */

let transaction: Sentry.Transaction;

export function startTrace(command: string) {
  if (process.env.NODE_ENV !== 'test') {
    Sentry.init({
      dsn: 'https://ef7592dc40c34510b9246633e453ef0e@sentry.iot.seluxit.com/124',

      // We recommend adjusting this value in production, or using tracesSampler
      // for finer control
      tracesSampleRate: 0.2,
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

  constructor(name: string, description?: string, data?: JsonObjType) {
    if (process.env.NODE_ENV !== 'test') {
      if (transaction) {
        this.span = transaction.startChild({
          op: name,
          description: description || '',
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

  error(status: string | AxiosError<JsonObjType>) {
    if (this.span) {
      if (typeof status === 'string') {
        this.span.setStatus(status);
      } else if (status.response?.status) {
        this.span.setStatus(status.response.status.toString());
      } else {
        this.span.setStatus('unknown');
      }
    }
  }

  done(status?: string | AxiosError<JsonObjType>) {
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

export function measure(
  name: string,
  description?: string,
  data?: JsonObjType
): Trace {
  return new Trace(name, description, data);
}

export async function section(
  name: string,
  code: () => Promise<JsonObjType>
): Promise<JsonObjType | null> {
  const t = new Trace('Section', name);
  Spinner.setMessage(name);
  try {
    const res = await code();
    t.done();
    return res;
  } catch (err) {
    if ((err as Error).message === 'not_found') {
      t.done('not_found');
    } else {
      t.done('unknown');
      throw err;
    }
  } finally {
    Spinner.stop();
  }
  return null;
}
