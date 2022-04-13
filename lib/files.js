import * as fs from 'node:fs';

export function directoryExists(filePath) {
  try {
    return fs.statSync(filePath).isDirectory();
  } catch (err) {
    return false;
  }
}

export function fileExists(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch (err) {
    return false;
  }
}

export function createFolders(dir) {
  const paths = dir.split('/').slice(0, -1);
  let path = '';
  paths.forEach((p) => {
    path += `${p}/`;
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path);
    }
  });
}

export function moveFile(file, out) {
  fs.renameSync(file, out);
}

export function deleteFile(file) {
  if (fs.existsSync(file) && fs.statSync(file).isFile()) {
    fs.unlinkSync(file);
  }
}

export function deleteFolder(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

export function loadFile(file, encoding = 'utf8') {
  try {
    return fs.readFileSync(file, encoding);
  } catch (err) {
    return false;
  }
}

export function loadJsonFile(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    return {};
  }
}

export function saveFile(file, data) {
  fs.writeFileSync(file, data);
}

export function saveJsonFile(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 4));
}

export function getAllFiles(dir, filter, ignoreDir) {
  let files = [];
  try {
    if (fs.statSync(dir).isDirectory()) {
      fs.readdirSync(dir).forEach((f) => {
        if (!ignoreDir.includes(f)) {
          const filePath = `${dir}/${f}`;
          if (fs.statSync(filePath).isFile()) {
            if (!filter || filter(filePath)) {
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

export function copyFile(src, dst) {
  fs.copyFileSync(src, dst);
}

export function modifiedFileTime(file) {
  const stats = fs.statSync(file);
  return stats.mtime;
}

export function createWriteStream(file) {
  return fs.createWriteStream(file);
}

export function createReadStream(file) {
  return createReadStream(file);
}
