// Cria o apps/api/.env a partir do .env.example na primeira execução.
// Um .env existente nunca é sobrescrito.
import { copyFileSync, existsSync } from 'node:fs';

const env = new URL('../.env', import.meta.url);
const example = new URL('../.env.example', import.meta.url);

if (!existsSync(env)) {
  copyFileSync(example, env);
  console.log('apps/api/.env criado a partir do .env.example.');
}
