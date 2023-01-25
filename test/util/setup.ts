import axios from 'axios';
import { join } from 'path';
import { tmpdir } from 'node:os';
import { mkdtemp, rmSync, mkdirSync, writeFileSync } from 'node:fs';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

export async function setup(
  init: boolean = true
): Promise<jest.Mocked<typeof axios>> {
  return new Promise<any>((resolve, reject) => {
    mkdtemp(join(tmpdir(), 'wappsto-cli-test-'), (err, directory) => {
      if (err) {
        reject(err);
      }

      process.chdir(directory);

      if (init) {
        mkdirSync('.wappsto-cli-cache');
        writeFileSync('.wappsto-cli-cache/session', 'session');

        mockedAxios.get.mockResolvedValueOnce({
          data: {
            meta: {
              id: 'session',
            },
          },
        });
      }

      resolve(mockedAxios);
    });
  });
}

export function teardown() {
  const dir = process.cwd();

  if (dir.includes('wappsto-cli-test-')) {
    rmSync(dir, { recursive: true, force: true });
  }
}
