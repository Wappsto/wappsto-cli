import readline from 'readline';
import tui from './tui.js';

export default class Spinner {
  constructor(title) {
    this.title = title;
    this.frames = ['|', '/', '-', '\\'];
  }

  setMessage(message) {
    this.title = message;
  }

  start() {
    const len = this.frames.length;
    let i = 0;

    this.timer = setInterval(() => {
      const str = this.frames[i % len];
      i += 1;
      readline.clearLine(process.stdout);
      readline.cursorTo(process.stdout, 0);
      tui.write(`${str} ${this.title}`);
    }, 80);
  }

  stop() {
    readline.clearLine(process.stdout);
    readline.cursorTo(process.stdout, 0);
    clearInterval(this.timer);
  }
}
