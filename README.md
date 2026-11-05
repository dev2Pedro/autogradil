# Autogradil

Calculadora de cercas Gradil. A partir do comprimento, da altura e da cor desejados, o sistema calcula quantas telas, postes, fixadores e parafusos são necessários, mostra o comprimento vendido (múltiplo de 2,5 m), desenha a cerca (desenho cotado e 3D) e guarda os pedidos confirmados em um histórico.

## Funcionalidades

- **Entradas:** comprimento livre em metros (até 3 casas decimais), altura (1,03 m, 1,53 m ou 2,03 m) e cor (sem pintura, branca, preta ou verde).
- **Cálculo:**
  - telas = `ceil(comprimento / 2,5 m)`;
  - postes = telas + 1, porque cada tela usa 2 postes e cada poste segura até 2 telas;
  - fixadores = telas × 3, 4 ou 6, conforme a altura (1,03 m, 1,53 m ou 2,03 m);
  - parafusos = postes × 4.
- **Saídas:** comprimento vendido, diferença para o comprimento pedido (só quando existe), tabela de componentes, desenho cotado e visualização 3D.
- **Pedidos:** confirmação ou descarte do pedido. Os pedidos confirmados são salvos com a data de confirmação e listados do mais recente para o mais antigo.
- **Histórico:**
  - filtro por cor, busca pelo número do pedido e ordenação (mais recentes, mais antigos, mais longos ou mais curtos);
  - cada pedido abre numa prancha com desenho cotado, visualização 3D e lista de materiais, que pode ser copiada;
  - exclusão de pedido, com confirmação.

### Premissa sobre os fixadores

O enunciado diz que a tela usa "3 fixadores, 4 e 6" conforme a altura, mas não esclarece se a quantidade vale por tela ou por poste. O projeto interpreta como **por tela**: cada tela do pedido leva 3, 4 ou 6 fixadores. Para 6 telas de 1,53 m, por exemplo, são 6 × 4 = 24 fixadores. O cálculo fica em `packages/shared/src/fence-calculator.ts` e é usado pela API e pela web. Se a regra for por poste, é preciso ajustá-lo e também os textos "por tela" da prancha do pedido e a posição dos fixadores no 3D.

### Visualizações

- **Desenho cotado:** vista frontal com as cotas de comprimento, altura e de cada tela. A área hachurada é a sobra da última tela. Cercas longas têm o trecho do meio encurtado, e a quebra indica quantas telas foram omitidas (por exemplo, `+2 telas`).
- **3D:** modelo interativo (girar, aproximar e mover). A tela é desenhada com fios verticais e horizontais e dobras em V, os postes têm tampa, base e parafusos, e os fixadores aparecem na quantidade do pedido. O detalhe completo vale para as primeiras 60 telas; as demais usam uma representação simplificada.

## Stack

| Parte             | Tecnologia                                                                                                              |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Monorepo          | npm workspaces                                                                                                          |
| `packages/shared` | TypeScript, Zod e Vitest (regras de cálculo, schemas e tipos compartilhados)                                            |
| `apps/api`        | NestJS 11, Prisma 7, SQLite (`better-sqlite3`) e Jest                                                                   |
| `apps/web`        | Next.js 16 (export estático), React 19, Tailwind 4, shadcn/ui, React Hook Form, Axios, React Three Fiber, drei e Vitest |

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

- Node.js 22 (a partir de 22.12), 24 ou 26. As versões ímpares (23 e 25) não são suportadas. Com [nvm](https://github.com/nvm-sh/nvm), rode `nvm use` na raiz: o `.nvmrc` seleciona o Node 22
- npm 10 ou superior

## Instalação

Na raiz, instale as dependências e suba o projeto:

```bash
npm install
```

```bash
npm run dev
```

O resto é automático:

- o `npm install` gera o Prisma Client;
- antes de subir a API, o `npm run dev` cria o `apps/api/.env` a partir do `.env.example` (se ainda não existir) e aplica as migrations, criando o banco SQLite em `apps/api/dev.db`. Os dados existentes são mantidos.

O `apps/web/.env.local` é opcional: sem ele, a web usa a API em `http://localhost:3001/api`. Para mudar, copie o exemplo:

```bash
cp apps/web/.env.example apps/web/.env.local
```

Para preparar o banco manualmente, sem subir a API:

```bash
npm run db:setup -w @autogradil/api
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

Na raiz, este comando compila o `shared`, prepara o `.env` e o banco da API e sobe API e web juntas:

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

O `build` gera o pacote `shared`, o site estático da web em `apps/web/out` e a API em `apps/api/dist`. O `start` prepara o `.env` e o banco da mesma forma que o `dev` e sobe somente a API. Sirva a pasta `apps/web/out` com qualquer servidor de arquivos estáticos, por exemplo:

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

| Script                                    | O que faz                                                                                       |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `npm run dev`                             | Sobe API e web em modo desenvolvimento                                                          |
| `npm run build`                           | Build de `shared`, web e API                                                                    |
| `npm run start`                           | Sobe a API compilada                                                                            |
| `npm run studio`                          | Abre o Prisma Studio                                                                            |
| `npm test`                                | Roda os testes de todos os workspaces (Vitest no `shared` e na web, Jest unitário e e2e na API) |
| `npm run typecheck`                       | Checagem de tipos em todos os workspaces                                                        |
| `npm run lint` / `npm run lint:fix`       | ESLint                                                                                          |
| `npm run format` / `npm run format:check` | Prettier                                                                                        |
