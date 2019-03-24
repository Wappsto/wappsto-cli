module.exports = class Spinner {
    constructor(title) {
        this.title = title;
        this.frames = ['|', '/', '-', '\\'];
    }

    start() {
        const len = this.frames.length; let
            i = 0;

        this.timer = setInterval(() => {
            const str = this.frames[i % len];
            i += 1;
            process.stdout.write(`\u001b[0G ${str} ${this.title}\r`);
        }, 80);
    }

    stop() {
        if (this.timer) {
            process.stdout.write('\u001b[0G\u001b[2K');
            clearInterval(this.timer);
        }
    }
};
