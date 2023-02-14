import { yellow, magenta, green, blue, red, white, bold } from 'kleur/colors';
import figlet from 'figlet';
import { clearLine, cursorTo } from 'readline';
import updateNotifier from 'simple-update-notifier';
import config from '../config';
import { VERSION } from './version';

class Tui {
  traceEnabled: boolean = false;
  debug: boolean = false;
  verbose: boolean = false;
  blocked: string[] | null = null;

  checkForUpdate(): Promise<void> {
    return updateNotifier({
      pkg: {
        name: 'wappsto-cli',
        version: VERSION,
      },
    });
  }

  clear(): void {
    clearLine(process.stdout, 0);
    cursorTo(process.stdout, 0);
  }

  header(text: string): Promise<void> {
    this.clear();

    this.write(
      `\n${yellow(
        figlet.textSync(text, { font: 'ANSI Shadow', horizontalLayout: 'full' })
      )}\r`
    );

    this.write(
      `${magenta(`[Wappsto CLI - Seluxit A/S - Version: ${VERSION}]`)}\n\n`
    );

    return this.checkForUpdate();
  }

  block(): void {
    this.blocked = [];
  }

  unblock(): void {
    const tmp = this.blocked;
    this.blocked = null;

    if (tmp) {
      tmp.forEach((item) => {
        /* istanbul ignore next */
        this.write(item);
      });
    }
  }

  showLog(
    msg: string,
    type: string,
    timestamp: string,
    logType?: string
  ): void {
    let res = '';
    if (timestamp) {
      res = `${magenta(`${timestamp}:`)} `;
    }
    if (type) {
      if (type === 'Background') {
        res += green(type);
      } else {
        res += blue(type);
      }
      res += ' - ';
    }
    if (logType === 'error') {
      res += red(msg);
    } else if (logType === 'warn') {
      res += yellow(msg);
    } else {
      res += msg;
    }
    this.showMessage(res);
  }

  showStream(event: any): void {
    /* istanbul ignore next */
    if (this.debug) {
      this.clear();

      this.write(`${yellow('T')} ${yellow('STREAM')} - `);
        this.write(JSON.stringify(event));
        this.write('\n');
    }
  }

  showTraffic(method: string, url: string, input: any, output: any): void {
    /* istanbul ignore next */
    if (this.debug) {
      this.clear();

      if (input.password) {
        input.password = '*****';
      }
      this.write(
        `${yellow('T')} ${yellow('HTTP')} - ${green(method)} ${blue(url)}`
      );
      this.write(': ');
      try {
        this.write(JSON.stringify(input));
      } catch (e) {
        console.log(input);
        this.write(red('Circular Structure'));
      }
      this.write(` ${yellow('=>')} `);
      try {
        this.write(JSON.stringify(output));
      } catch (e) {
        this.write(blue('Binary Data'));
      }
      this.write('\n');
    }
  }

  showVerbose(type: string, msg: string, data?: any): void {
    /* istanbul ignore next */
    if (this.verbose) {
      this.clear();

      this.write(`${yellow('I')} ${yellow(type)} - ${green(msg)}`);
      if (data) {
        this.write(` => ${JSON.stringify(data)}`);
      }
      this.write('\n');
    }
  }

  showDebug(type: string, msg: string, data?: any): void {
    /* istanbul ignore next */
    if (this.debug) {
      this.clear();

      this.write(`${yellow('D')} ${blue(type)} - ${green(msg)}`);
      if (data) {
        this.write(` => ${JSON.stringify(data)}`);
      }
      this.write('\n');
    }
  }

  showMessage(msg: string, str?: string, end?: string): void {
    this.clear();
    this.write(`${green('*')} ${bold(white(msg))}`);
    if (str) {
      this.write(str);
    }
    this.write(end || '\n');
  }

  showStatus(msg: string): void {
    this.clear();
    this.write(`${green('*')} ${bold(green(msg))}\n`);
  }

  showWarning(msg: string): void {
    this.clear();
    this.write(`${red('!')} ${bold(yellow(msg))}\n`);
  }

  showError(msg: string, err?: any): void {
    let strMsg = bold(red(msg));
    let strErr = '';
    if (err) {
      let data;
      if (err.response && err.response.data) {
        data = err.response.data;
      } else if (err.data) {
        data = err.data;
      }
      if (data) {
        if (data.code === 117000000) {
          // do not print invalid session error
        } else if (data.code === 300098) {
          strMsg += `${red(data.message)}\n`;
          strMsg += `Please visit ${config.host()}/pricing for more information`;
        } else {
          strErr = `${JSON.stringify(data)}\n`;
        }
      } else if (err.stack) {
        console.error(err);
      } else if (typeof err === 'string') {
        strErr = `${err}\n`;
      } else {
        strErr = `${JSON.stringify(err)}\n`;
      }
    }

    this.clear();
    this.write(`\r${red('!')} ${strMsg}\n`);
    if (this.verbose && strErr) {
      this.write(strErr);
    }
  }

  trace(model: string, method: string, data?: any): void {
    if (!this.traceEnabled) {
      return;
    }

    const str = `${bold(red(model))}.${bold(blue(method))}`;
    if (data) {
      console.trace(str, data);
    } else {
      console.trace(str);
    }
  }

  /* istanbul ignore next */
  write(msg: string): void {
    if (this.blocked) {
      this.blocked.push(msg);
      return;
    }

    if (process.env.NODE_ENV !== 'test') {
      process.stdout.write(msg);
    }
  }
}

const tui = new Tui();
export default tui;
