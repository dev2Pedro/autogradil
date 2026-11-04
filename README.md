# Autogradil

Calculadora de cercas Gradil. A partir do comprimento, da altura e da cor desejados, o sistema calcula quantas telas, postes, fixadores e parafusos são necessários, mostra o comprimento vendido (múltiplo de 2,5 m), desenha a cerca (desenho cotado e 3D) e guarda os pedidos confirmados em um histórico.

## Funcionalidades

- **Entradas:** comprimento livre em metros (até 3 casas decimais), altura (1,03 m, 1,53 m ou 2,03 m) e cor (sem pintura, branca, preta ou verde).
- **Cálculo:**
  - telas = `ceil(comprimento / 2,5 m)`;
  - postes = telas + 1;
  - fixadores = telas × 3, 4 ou 6, conforme a altura;
  - parafusos = postes × 4.
- **Saídas:** comprimento vendido, diferença para o comprimento pedido (só quando existe), tabela de componentes, desenho cotado e visualização 3D.
- **Pedidos:** confirmação ou descarte do pedido. Os pedidos confirmados são salvos com a data de confirmação e listados do mais recente para o mais antigo.

## Stack

| Parte             | Tecnologia                                                                                                |
| ----------------- | --------------------------------------------------------------------------------------------------------- |
| Monorepo          | npm workspaces                                                                                            |
| `packages/shared` | TypeScript, Zod e Vitest (regras de cálculo, schemas e tipos compartilhados)                              |
| `apps/api`        | NestJS 11, Prisma 7, SQLite (`better-sqlite3`) e Jest                                                     |
| `apps/web`        | Next.js 16 (export estático), React 19, Tailwind 4, shadcn/ui, React Hook Form, Axios e React Three Fiber |

## Estrutura

```
autogradil/
├── apps/
│   ├── api/          # API REST (NestJS + Prisma)
│   │   ├── prisma/   # schema.prisma e migrations
│   │   └── src/      # módulos calculator, orders, health, prisma
│   └── web/          # front-end (Next.js)
│       └── src/      # app/, components/, lib/
└── packages/
    └── shared/       # cálculo da cerca, constantes, schemas Zod e tipos
```

## Pré-requisitos

- Node.js 20 ou superior
- npm 10 ou superior

## Instalação

1. Instale as dependências de todos os workspaces a partir da raiz:

   ```bash
   npm install
   ```

2. Crie os arquivos de ambiente a partir dos exemplos:

   ```bash
   cp apps/api/.env.example apps/api/.env
   ```

   ```bash
   cp apps/web/.env.example apps/web/.env.local
   ```

3. Gere o Prisma Client e crie o banco SQLite (`apps/api/dev.db`):

   ```bash
   cd apps/api && npx prisma generate && npx prisma migrate deploy
   ```

### Variáveis de ambiente

**`apps/api/.env`**

| Variável       | Exemplo                 | Descrição                                                                       |
| -------------- | ----------------------- | ------------------------------------------------------------------------------- |
| `PORT`         | `3001`                  | Porta da API                                                                    |
| `CORS_ORIGIN`  | `http://localhost:3000` | Origem liberada para o front-end                                                |
| `DATABASE_URL` | `file:./dev.db`         | Caminho do banco SQLite. Um caminho relativo é resolvido a partir de `apps/api` |

**`apps/web/.env.local`**

| Variável                   | Exemplo                     | Descrição                                                                                                                                                                                            |
| -------------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:3001/api` | URL base da API. Sem a variável, usa `http://localhost:3001/api`. Como o front-end é exportado como site estático, o valor é fixado no `build`: em produção, defina-o antes de rodar `npm run build` |

As variáveis da API são validadas com Zod na inicialização. Um valor inválido (por exemplo `PORT=abc`) impede a API de subir e mostra qual variável está errada.

## Como rodar

### Desenvolvimento

Na raiz, este comando compila o `shared` e sobe API e web juntas:

```bash
npm run dev
```

- Web: http://localhost:3000
- API: http://localhost:3001/api
- Health check: http://localhost:3001/api/health

Para subir cada parte separadamente:

```bash
npm run dev:api
```

```bash
npm run dev:web
```

> Se você alterar `packages/shared`, rode `npm run build -w @autogradil/shared` para a API e a web enxergarem a mudança.

### Produção

```bash
npm run build
```

```bash
npm run start
```

O `build` gera o pacote `shared`, o site estático da web em `apps/web/out` e a API em `apps/api/dist`. O `start` sobe somente a API. Sirva a pasta `apps/web/out` com qualquer servidor de arquivos estáticos, por exemplo:

```bash
npx serve apps/web/out -l 3000
```

## Banco de dados (Prisma)

### Prisma Studio

Abre uma interface visual do banco em http://localhost:5555:

```bash
npm run studio
```

### Criar uma migration após alterar o `schema.prisma`

```bash
cd apps/api && npx prisma migrate dev --name nome-da-mudanca
```

### Regenerar o Prisma Client

```bash
cd apps/api && npx prisma generate
```

### Zerar o banco

> **Atenção:** apaga todos os pedidos salvos.

```bash
cd apps/api && npx prisma migrate reset
```

## Endpoints da API

Todas as rotas usam o prefixo `/api`.

| Método   | Rota          | Descrição                                                                                                        |
| -------- | ------------- | ---------------------------------------------------------------------------------------------------------------- |
| `GET`    | `/health`     | Verifica se a API está no ar                                                                                     |
| `POST`   | `/calculate`  | Calcula componentes e comprimento vendido. Body: `{ lengthMm, heightMm, color }`                                 |
| `POST`   | `/orders`     | Confirma um pedido. Body: `{ lengthMm, heightMm, color, clientRequestId }`. É idempotente pelo `clientRequestId` |
| `GET`    | `/orders`     | Lista os pedidos confirmados, do mais recente para o mais antigo                                                 |
| `DELETE` | `/orders/:id` | Exclui um pedido                                                                                                 |

Os comprimentos trafegam em milímetros inteiros (`lengthMm`, `heightMm`) para evitar erros de ponto flutuante. Os erros seguem o formato:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados inválidos.",
    "fields": { "lengthMm": "..." }
  }
}
```

Exemplo de cálculo:

```bash
curl -X POST http://localhost:3001/api/calculate -H "Content-Type: application/json" -d '{"lengthMm":12500,"heightMm":1530,"color":"green"}'
```

## Scripts úteis (raiz)

| Script                                    | O que faz                                                                              |
| ----------------------------------------- | -------------------------------------------------------------------------------------- |
| `npm run dev`                             | Sobe API e web em modo desenvolvimento                                                 |
| `npm run build`                           | Build de `shared`, web e API                                                           |
| `npm run start`                           | Sobe a API compilada                                                                   |
| `npm run studio`                          | Abre o Prisma Studio                                                                   |
| `npm test`                                | Roda os testes de todos os workspaces (Vitest no `shared`, Jest unitário e e2e na API) |
| `npm run typecheck`                       | Checagem de tipos em todos os workspaces                                               |
| `npm run lint` / `npm run lint:fix`       | ESLint                                                                                 |
| `npm run format` / `npm run format:check` | Prettier                                                                               |
