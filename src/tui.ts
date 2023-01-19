import {
  yellow,
  magenta,
  green,
  blue,
  red,
  white as whiteBright,
  bold,
} from 'kleur/colors';
import figlet from 'figlet';
import { clearLine, cursorTo } from 'readline';
import updateNotifier from 'simple-update-notifier';
import config from './config';
import packageJson from '../package.json';
/*import { createRequire } from 'module';
const require = createRequire(import.meta.url || '');
const packageJson = require('../package.json');*/

class Tui {
  verbose: boolean = false;
  blocked?: string[];

  checkForUpdate(): Promise<void> {
    return updateNotifier({ pkg: packageJson });
  }

  header(text: string): Promise<void> {
    clearLine(process.stdout, 0);
    this.write(
      `\n${yellow(
        figlet.textSync(text, { font: 'ANSI Shadow', horizontalLayout: 'full' })
      )}\r`
    );

    this.write(
      `${magenta(
        `[Wappsto CLI - Seluxit A/S - Version: ${packageJson.version}]`
      )}\n\n`
    );

    return this.checkForUpdate();
  }

  block(): void {
    this.blocked = [];
  }

  unblock(): void {
    const tmp = this.blocked;
    this.blocked = undefined;

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

  showVerbose(type: string, msg: string, data?: any): void {
    if (this.verbose) {
      clearLine(process.stdout, 0);
      cursorTo(process.stdout, 0);
      this.write(`${yellow('I')} ${yellow(type)} - ${green(msg)}`);
      if (data) {
        this.write(` => ${JSON.stringify(data)}`);
      }
      this.write('\n');
    }
  }

  showMessage(msg: string, str?: string, end?: string): void {
    this.write(`${green('*')} ${bold(whiteBright(msg))}`);
    if (str) {
      this.write(str);
    }
    this.write(end || '\n');
  }

  showStatus(msg: string): void {
    this.write(`${green('*')} ${bold(green(msg))}\n`);
  }

  showWarning(msg: string): void {
    this.write(`${red('!')} ${bold(yellow(msg))}\n`);
  }

  showError(msg: string, err?: any): void {
    this.write(`\r${red('!')} ${bold(red(msg))}\n`);
    if (err) {
      if (err.response && err.response.data) {
        if (err.response.data.code === 300098) {
          this.write(`${red(err.response.data.message)}\n`);
          this.write(
            `Please visit ${config.host()}/pricing for more information\n`
          );
        } else {
          this.write(`${JSON.stringify(err.response.data)}\n`);
        }
      } else if (err.stack) {
        // eslint-disable-next-line no-console
        console.error(err);
      } else if (typeof err === 'string') {
        this.write(`${err}\n`);
      } else {
        this.write(`${JSON.stringify(err)}\n`);
      }
    }
  }

  /* istanbul ignore next */
  write(msg: string): void {
    if (this.blocked) {
      this.blocked.push(msg);
      return;
    }

    process.stdout.write(msg);
  }
}

const tui = new Tui();
export default tui;
