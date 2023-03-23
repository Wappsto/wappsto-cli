import Config from '../config';

export function validateFile(file: string): boolean {
  const ending = file.split('.').slice(-1)[0];
  return (
    [
      'html',
      'svg',
      'yaml',
      'yml',
      'css',
      'js',
      'mjs',
      'cjs',
      'json',
      'gif',
      'png',
      'jpg',
      'jpeg',
    ].indexOf(ending) !== -1
  );
}

export function getFileType(file: string): string {
  const ending = file.split('.').slice(-1)[0];
  switch (ending) {
    case 'js':
    case 'mjs':
    case 'cjs':
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

export function getFileName(file: string): string {
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

export function getFileUse(file: string): string {
  if (file.startsWith(Config.foreground())) {
    return 'foreground';
  }
  if (file.startsWith(Config.background())) {
    return 'background';
  }
  return file.split('/')[0];
}

export function getFilePath(use: string): string {
  switch (use) {
    case 'foreground':
      return Config.foreground();
    case 'background':
      return Config.background();
    default:
      return use;
  }
}

export function compareVersions(
  oldVersion: Record<string, any>,
  newVersion: Record<string, any>
): boolean {
  if (!oldVersion || !newVersion) {
    return false;
  }
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
        obj1.length === obj2.length &&
        obj1.every((u: any, index: number) => u === obj2[index])
      ) {
        return true;
      }
    } else if (compareVersions(oldVersion[key], newVersion[key])) {
      return true;
    }
  }

  return false;
}

export function snooze(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function past(name: string) {
  return name.endsWith('e') ? `${name}d` : `${name}ed`;
}
