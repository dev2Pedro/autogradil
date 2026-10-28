import path from 'path';
import { resolveDatabaseUrl } from './resolve-database-url';

const API_ROOT = path.resolve(__dirname, '..', '..');

describe('resolveDatabaseUrl', () => {
  it('torna absoluta uma URL file: relativa, a partir da raiz da API', () => {
    expect(resolveDatabaseUrl('file:./dev.db')).toBe(`file:${path.join(API_ROOT, 'dev.db')}`);
  });

  it('resolve caminhos relativos com subpastas e ..', () => {
    expect(resolveDatabaseUrl('file:../data/app.db')).toBe(
      `file:${path.resolve(API_ROOT, '..', 'data', 'app.db')}`,
    );
  });

  it('mantém uma URL file: já absoluta', () => {
    const absolute = `file:${path.join(path.sep, 'var', 'data', 'app.db')}`;

    expect(resolveDatabaseUrl(absolute)).toBe(absolute);
  });

  it('mantém URLs que não são file:', () => {
    expect(resolveDatabaseUrl('libsql://exemplo.turso.io')).toBe('libsql://exemplo.turso.io');
  });

  it('não depende do diretório de trabalho', () => {
    const cwd = process.cwd();
    process.chdir(path.sep);

    try {
      expect(resolveDatabaseUrl('file:./dev.db')).toBe(`file:${path.join(API_ROOT, 'dev.db')}`);
    } finally {
      process.chdir(cwd);
    }
  });
});
