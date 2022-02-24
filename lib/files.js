const fs = require('fs');

module.exports = {
  directoryExists: (filePath) => {
    try {
      return fs.statSync(filePath).isDirectory();
    } catch (err) {
      return false;
    }
  },

  fileExists: (filePath) => {
    try {
      return fs.statSync(filePath).isFile();
    } catch (err) {
      return false;
    }
  },

  createFolders: (dir) => {
    const paths = dir.split('/').slice(0, -1);
    let path = '';
    paths.forEach((p) => {
      path += `${p}/`;
      if (!fs.existsSync(path)) {
        fs.mkdirSync(path);
      }
    });
  },

  deleteFile: (file) => {
    if (fs.existsSync(file) && fs.statSync(file).isFile()) {
      fs.unlinkSync(file);
    }
  },

  deleteFolder: (dir) => {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  },

  loadFile: (file, encoding = 'utf8') => {
    try {
      return fs.readFileSync(file, encoding);
    } catch (err) {
      return false;
    }
  },

  loadJsonFile: (file) => {
    try {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (err) {
      return {};
    }
  },

  saveFile: (file, data) => {
    fs.writeFileSync(file, data);
  },

  saveJsonFile: (file, data) => {
    fs.writeFileSync(file, JSON.stringify(data, null, 4));
  },

  getAllFiles: (dir, filter, ignoreDir) => {
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
              files = files.concat(
                module.exports.getAllFiles(filePath, filter, ignoreDir),
              );
            }
          }
        });
      }
    } catch (err) {
      return [];
    }
    return files;
  },
};
