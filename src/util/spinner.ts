import { clearLine, cursorTo } from 'node:readline';
import tui from './tui';

export default class Spinner {
  timer: any;
  title: string;
  frames: string[] = ['|', '/', '-', '\\'];

  constructor(title: string) {
    this.title = title;
  }

  setMessage(message: string): void {
    this.title = message;
  }

  start(): void {
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
  }
}