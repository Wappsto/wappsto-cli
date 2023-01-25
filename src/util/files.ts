import {
  statSync,
  existsSync,
  mkdirSync,
  unlinkSync,
  rmSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  renameSync,
  copyFileSync,
} from 'fs';

export function directoryExists(filePath: string): boolean {
  try {
    return statSync(filePath).isDirectory();
  } catch (err) {
    return false;
  }
}

export function fileExists(filePath: string): boolean {
  try {
    return statSync(filePath).isFile();
  } catch (err) {
    return false;
  }
}

export function createFolders(dir: string) {
  const paths = dir.split('/').slice(0, -1);
  let path = '';
  paths.forEach((p) => {
    path += `${p}/`;
    if (!existsSync(path)) {
      mkdirSync(path);
    }
  });
}

export function moveFile(file: string, out: string) {
  renameSync(file, out);
}

export function copyFile(src: string, dst: string) {
  copyFileSync(src, dst);
}

export function deleteFile(file: string) {
  if (existsSync(file) && statSync(file).isFile()) {
    unlinkSync(file);
  }
}

export function deleteFolder(dir: string) {
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
  }
}

export function loadFile(file: string): string {
  try {
    return readFileSync(file, 'utf8');
  } catch (err) {
    return '';
  }
}

export function loadJsonFile(file: string): any {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (err) {
    return {};
  }
}

export function saveFile(file: string, data: string) {
  writeFileSync(file, data);
}

export function saveJsonFile(file: string, data: any) {
  writeFileSync(file, JSON.stringify(data, null, 4));
}

export function getAllFiles(
  dir: string,
  filter: (path: string) => boolean,
  ignoreDir: string[]
): string[] {
  let files: string[] = [];
  try {
    if (statSync(dir).isDirectory()) {
      readdirSync(dir).forEach((f) => {
        if (!ignoreDir.includes(f)) {
          const filePath = `${dir}/${f}`;
          if (statSync(filePath).isFile()) {
            if (filter(filePath)) {
              files.push(filePath);
            }
          } else {
            files = files.concat(getAllFiles(filePath, filter, ignoreDir));
          }
        }
      });
    }
  } catch (err) {
    return [];
  }
  return files;
}
