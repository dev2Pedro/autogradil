import 'dotenv/config';
import { pathToFileURL } from 'url';
import { defineConfig } from 'prisma/config';
import { resolveDatabaseUrl } from './src/prisma/resolve-database-url';

// O Prisma Studio só aceita SQLite com caminho absoluto no formato file:///.
function datasourceUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;

  const resolved = resolveDatabaseUrl(url);
  return resolved.startsWith('file:')
    ? pathToFileURL(resolved.slice('file:'.length)).href
    : resolved;
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: datasourceUrl(process.env['DATABASE_URL']),
  },
});
