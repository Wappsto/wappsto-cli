import axios from 'axios';
import { join } from 'path';
import { tmpdir } from 'node:os';
import { mkdtemp, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { saveJsonFile } from '../../src/util/files';
import Config from '../../src/config';

//jest.mock("../../src/util/getDirName.ts");
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
        mkdirSync(Config.cacheFolder());
        writeFileSync(`${Config.cacheFolder()}session`, 'session');

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

export function createWapp() {
  saveJsonFile('manifest.json', {
    name: 'Wapp name',
    author: 'Wapp Author',
    version_app: '1.2.3',
    supported_features: ['foreground'],
    max_number_installation: 1,
    description: {
      general: 'Wapp description',
      foreground: 'Wapp Foreground',
      version: '',
      widget: '',
    },
  });

  saveJsonFile(`${Config.cacheFolder()}application`, {
    meta: {
      id: '4c8ebb21-524b-4fc0-bbc5-015da2e5ca60',
      revision: 1,
      type: 'application',
      version: '2.1',
    },
    name: 'Wapp name',
    version: [
      {
        meta: {
          id: '98e68cd8-74a6-4841-bdd4-70c29f068056',
          revision: 1,
          type: 'version',
          version: '2.1',
        },
        author: 'Wapp Author',
        status: 'idle',
        description: {
          foreground: 'Wapp Foreground',
          general: 'Wapp description',
          version: '',
          widget: '',
        },
        max_number_installation: 1,
        supported_features: ['foreground'],
        version_app: '1.2.3',
        name: 'Wapp name',
        file: [],
        used_files: {},
      },
    ],
  });

  saveJsonFile(`${Config.cacheFolder()}installation`, {
    meta: {
      id: 'a3c75f15-5d07-4b97-ae8b-91e0d435e49c',
      type: 'installation',
      version: '2.1',
    },
    token_installation:
      '22a06c7ff5ceab0ef412495f248f5e7f50ca88c26eb8c8ab57852da7f792d77aeec40c87ee7b25875b8624e5c4a6a2842192801e7641c2b78809d70bbe73d470',
    supported_features: ['background', 'foreground'],
    application: '866ee500-6c8d-4ccb-a41e-ace97c7b2243',
    version_id: 'c07cb6b3-a1e2-4007-ba55-92887925f34d',
  });
}
