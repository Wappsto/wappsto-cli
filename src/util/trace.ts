import * as Sentry from '@sentry/node';
import { AxiosError } from 'axios';
import Config from '../config';
import Session from '../session';
import { JsonObjType } from '../types/custom';
import Spinner from './spinner';
import { VERSION } from './version';

// `@sentry/profiling-node` loads a precompiled native binary at import time.
// On Node versions where no matching binary ships (e.g. Node 24 with v8 of the
// package), the require throws and crashes the CLI before any Sentry code runs.
// Load it defensively so profiling becomes best-effort.
let profilingIntegration: ReturnType<
  typeof import('@sentry/profiling-node').nodeProfilingIntegration
> | undefined;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { nodeProfilingIntegration } = require('@sentry/profiling-node');
  profilingIntegration = nodeProfilingIntegration();
} catch {
  profilingIntegration = undefined;
}

/* istanbul ignore file */
if (process.env.NODE_ENV !== 'test') {
  Sentry.init({
    dsn: 'https://ef7592dc40c34510b9246633e453ef0e@sentry.iot.seluxit.com/124',
    integrations: profilingIntegration ? [profilingIntegration] : [],
    // We recommend adjusting this value in production, or using tracesSampler
    // for finer control
    tracesSampleRate: 0.2,
    profilesSampleRate: profilingIntegration ? 1.0 : 0,
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
