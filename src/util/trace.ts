import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import '@sentry/tracing';
import { AxiosError } from 'axios';
import Config from '../config';
import Session from '../session';
import { JsonObjType } from '../types/custom';
import Spinner from './spinner';
import { VERSION } from './version';

/* istanbul ignore file */
if (process.env.NODE_ENV !== 'test') {
  Sentry.init({
    dsn: 'https://ef7592dc40c34510b9246633e453ef0e@sentry.iot.seluxit.com/124',
    integrations: [
      // Add our Profiling integration
      nodeProfilingIntegration(),
    ],
    // We recommend adjusting this value in production, or using tracesSampler
    // for finer control
    tracesSampleRate: 0.2,
    profilesSampleRate: 1.0,
    environment: Config.env(),
    release: `wappsto-cli@${VERSION}`,
  });
}

export function setUser(session: Session) {
  if (process.env.NODE_ENV !== 'test') {
    Sentry.setUser({
      id: session.user || 'unknown user',
    });
  }
}

export default class Trace {
  constructor(
    name: string,
    callback: () => void,
    description: string,
    data?: JsonObjType
  ) {
    if (process.env.NODE_ENV !== 'test') {
      Sentry.startSpan(
        {
          name: name,
          op: description,
        },
        () => {
          if (data) {
            Sentry.getActiveSpan()?.setAttribute('data', data);
          }
          callback();
        }
      );
    }
  }

  ok() {
    Sentry.getActiveSpan()?.setStatus({ code: 1, message: 'ok' });
  }

  error(status: string | AxiosError<JsonObjType>) {
    if (typeof status === 'string') {
      Sentry.getActiveSpan()?.setStatus({ code: 2, message: status });
    } else if (status.response?.status) {
      Sentry.getActiveSpan()?.setStatus({
        code: 2,
        message: status.response.status.toString(),
      });
    } else {
      Sentry.getActiveSpan()?.setStatus({ code: 2, message: 'unknown' });
    }
  }

  done(status?: string | AxiosError<JsonObjType>) {
    if (status) {
      this.error(status);
    } else {
      this.ok();
    }
    Sentry.getActiveSpan()?.end();
  }
}

export function measure(
  name: string,
  callback: () => void,
  description: string,
  data?: JsonObjType
): Trace {
  return new Trace(name, callback, description, data);
}

export async function section(
  name: string,
  code: () => Promise<JsonObjType>
): Promise<JsonObjType | null> {
  Spinner.setMessage(name);
  try {
    const res = await code();
    return res;
  } catch (err) {
    if ((err as Error).message !== 'not_found') {
      throw err;
    }
  } finally {
    Spinner.stop();
  }
  return null;
}
