import Config from './config.js';

export default class Util {
  static validateFile(file) {
    const ending = file.split('.').slice(-1)[0];
    return (
      [
        'html',
        'svg',
        'yaml',
        'yml',
        'css',
        'js',
        'json',
        'gif',
        'png',
        'jpg',
        'jpeg',
      ].indexOf(ending) !== -1
    );
  }

  static getFileType(file) {
    const ending = file.split('.').slice(-1)[0];
    switch (ending) {
      case 'js':
        return 'application/javascript';
      case 'json':
        return 'application/json';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
        return `image/${ending}`;
      default:
        return `text/${ending}`;
    }
  }

  static getFileName(file) {
    if (file.startsWith(Config.foreground())) {
      return file.replace(`${Config.foreground()}/`, '');
    }
    if (file.startsWith(Config.background())) {
      return file.replace(`${Config.background()}/`, '');
    }
    const tmp = file.split('/');
    tmp.shift();
    return tmp.join('/');
  }

  static getFileUse(file) {
    if (file.startsWith(Config.foreground())) {
      return 'foreground';
    }
    if (file.startsWith(Config.background())) {
      return 'background';
    }
    return file.split('/')[0];
  }

  static getFilePath(use) {
    switch (use) {
      case 'foreground':
        return Config.foreground();
      case 'background':
        return Config.background();
      default:
        return use;
    }
  }

  static compareVersions(oldVersion, newVersion) {
    const keys = Object.keys(oldVersion);
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      const obj1 = oldVersion[key];
      const obj2 = newVersion[key];
      if (typeof oldVersion[key] === 'string') {
        if (obj1 !== obj2) {
          return true;
        }
      } else if (Array.isArray(oldVersion[key])) {
        if (
          obj1.length === obj2.length
          && obj1.every((u, index) => u === obj2[index])
        ) {
          return true;
        }
      } else if (Util.compareVersions(oldVersion[key], newVersion[key])) {
        return true;
      }
    }

    return false;
  }

  static snooze(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}
