import { mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';

// Roda antes dos imports de cada arquivo de teste: o ConfigModule valida o ambiente
// ao importar o AppModule, então o banco temporário precisa estar definido antes.
const dbDir = mkdtempSync(path.join(tmpdir(), 'autogradil-e2e-'));
process.env.DATABASE_URL = `file:${path.join(dbDir, 'test.db')}`;
