const fs = require('fs');
const mkdirp = require('mkdirp');

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
        mkdirp.sync(dir.split('/').slice(0, -1).join('/'));
    },

    deleteFile: (file) => {
        if (fs.existsSync(file) && fs.statSync(file).isFile()) {
            fs.unlinkSync(file);
        }
    },

    deleteFolder: (dir) => {
        if (fs.existsSync(dir)) {
            fs.readdirSync(dir).forEach((file) => {
                const curPath = `${dir}/${file}`;
                if (fs.lstatSync(curPath).isDirectory()) { // recurse
                    module.exports.deleteFolder(curPath);
                } else { // delete file
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(dir);
        }
    },

    loadFile: (file) => {
        try {
            return fs.readFileSync(file, 'utf8');
        } catch (err) {
            return '';
        }
    },

    loadJsonFile: (file) => {
        try {
            return JSON.parse(fs.readFileSync(file, 'utf8'));
        } catch (err) {
            return {};
        }
    },

    getAllFiles: (dir, filter) => {
        let files = [];
        try {
            if (fs.statSync(dir).isDirectory()) {
                fs.readdirSync(dir).forEach((f) => {
                    const filePath = `${dir}/${f}`;
                    if (fs.statSync(filePath).isFile()) {
                        if (!filter || filter(filePath)) {
                            files.push(filePath);
                        }
                    } else {
                        files = files.concat(module.exports.getAllFiles(filePath, filter));
                    }
                });
            }
        } catch (err) {
            return [];
        }
        return files;
    },
};
