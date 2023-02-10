import { fileURLToPath } from 'url';
import { dirname } from 'path';

export default function getDirName() {
  return dirname(fileURLToPath(import.meta.url));
}
