import * as path from 'path';
import os from 'node:os';
import { mkdtemp, rmSync } from 'node:fs';

export async function setup() {
  return new Promise<void>((resolve, reject) => {
    mkdtemp(path.join(os.tmpdir(), 'wappsto-cli-test-'), (err, directory) => {
      if (err) {
        reject(err);
      }

      process.chdir(directory);
      resolve();
    });
  });
}

export function teardown() {
  const dir = process.cwd();

  if (dir.includes('wappsto-cli-test-')) {
    rmSync(dir, { recursive: true, force: true });
  }
}
