import watch from 'node-watch';
import Config from '../config';

function registerBackgroundWatcher(cb: (name: string) => Promise<void>): void {
  let restarting = false;
  watch(
    Config.background(),
    {
      filter(f, skip) {
        // skip node_modules
        if (/\/node_modules/.test(f)) return skip;
        // skip .git folder
        if (/\.git/.test(f)) return skip;
        if (/\.#/.test(f)) return skip;
        // only watch for js and json files
        return /\.js|\.json$/.test(f);
      },
      recursive: true,
    },
    (evt, name) => {
      if (!restarting) {
        restarting = true;
        cb(name).then(() => {
          restarting = false;
        });
      }
    }
  );
}

export default registerBackgroundWatcher;
