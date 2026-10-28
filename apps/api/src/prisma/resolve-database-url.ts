import path from 'path';

const FILE_PREFIX = 'file:';
const API_ROOT = path.resolve(__dirname, '..', '..');

export function resolveDatabaseUrl(url: string): string {
  if (!url.startsWith(FILE_PREFIX)) {
    return url;
  }

  const filePath = url.slice(FILE_PREFIX.length);

  if (path.isAbsolute(filePath)) {
    return url;
  }

  return FILE_PREFIX + path.resolve(API_ROOT, filePath);
}
