import { dirname } from 'path';
import { fileURLToPath } from 'url';

export default function getDirName() {
  return dirname(fileURLToPath(import.meta.url));
}
