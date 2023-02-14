import { clearLine, cursorTo } from 'node:readline';
import tui from './tui';

export default class Spinner {
  timer: ReturnType<typeof setInterval> | undefined;
  title: string = '';
  frames: string[] = ['|', '/', '-', '\\'];

  constructor(title: string) {
    this.setMessage(title);
  }

  setMessage(message: string): void {
    tui.showVerbose('STATUS', message);
    this.title = `${message}, please wait...`;
    this.start();
  }

  start(): void {
    if (this.timer) {
      return;
    }

    const len = this.frames.length;
    let i = 0;

    this.timer = setInterval(() => {
      const str = this.frames[i % len];
      i += 1;
      clearLine(process.stdout, 0);
      cursorTo(process.stdout, 0);
      tui.write(`${str} ${this.title}`);
    }, 80);
  }

  stop(): void {
    clearLine(process.stdout, 0);
    cursorTo(process.stdout, 0);
    clearInterval(this.timer);
    this.timer = undefined;
  }
}
