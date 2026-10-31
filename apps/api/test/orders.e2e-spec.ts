import { execSync } from 'child_process';
import { randomUUID } from 'crypto';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from 'src/app.module';
import { HttpExceptionFilter } from 'src/common/http-exception.filter';

describe('/api/orders', () => {
  const dbDir = mkdtempSync(path.join(tmpdir(), 'autogradil-e2e-'));
  let app: INestApplication;

  beforeAll(async () => {
    process.env.DATABASE_URL = `file:${path.join(dbDir, 'test.db')}`;
    execSync('npx prisma migrate deploy', {
      cwd: path.resolve(__dirname, '..'),
      env: { ...process.env, NODE_OPTIONS: '' },
      stdio: 'ignore',
    });

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    rmSync(dbDir, { recursive: true, force: true });
  });

  function post(body: object) {
    return request(app.getHttpServer()).post('/api/orders').send(body);
  }

  function orderInput() {
    return { lengthMm: 6000, heightMm: 1530, color: 'white', clientRequestId: randomUUID() };
  }

  function list() {
    return request(app.getHttpServer()).get('/api/orders');
  }

  // Precisa ser o primeiro teste: os demais gravam no mesmo banco.
  it('GET retorna [] quando não há pedidos', async () => {
    const response = await list();

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('cria o pedido com 201 e confirmedAt gerado pelo servidor', async () => {
    const input = orderInput();
    const response = await post({ ...input, panels: 999, confirmedAt: '2000-01-01T00:00:00.000Z' });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject(input);
    expect(response.body).not.toHaveProperty('panels');
    expect(response.body.confirmedAt).not.toBe('2000-01-01T00:00:00.000Z');
  });

  it('retorna 200 com o pedido existente ao repetir o mesmo payload', async () => {
    const input = orderInput();
    const first = await post(input);
    const second = await post(input);

    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(second.body).toEqual(first.body);
  });

  it('gera um único registro em requisições simultâneas com o mesmo clientRequestId', async () => {
    const input = orderInput();
    const responses = await Promise.all(Array.from({ length: 5 }, () => post(input)));
    const statuses = responses.map((response) => response.status).sort();

    expect(statuses).toEqual([200, 200, 200, 200, 201]);
    expect(new Set(responses.map((response) => response.body.id)).size).toBe(1);
  });

  it('retorna 409 ao repetir o clientRequestId com payload diferente', async () => {
    const input = orderInput();
    await post(input);
    const response = await post({ ...input, lengthMm: 7000 });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      error: {
        code: 'CONFLICT',
        message: 'Este clientRequestId já foi usado em um pedido com outros dados.',
        fields: {},
      },
    });
  });

  it('retorna 400 com os campos inválidos', async () => {
    const response = await post({ lengthMm: -1 });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(Object.keys(response.body.error.fields)).toEqual(
      expect.arrayContaining(['lengthMm', 'heightMm', 'color', 'clientRequestId']),
    );
  });

  it('GET lista do mais recente ao mais antigo', async () => {
    const created = [];
    for (let i = 0; i < 3; i++) created.push((await post(orderInput())).body);

    const response = await list();
    const ids: number[] = response.body.map((order: { id: number }) => order.id);

    expect(response.status).toBe(200);
    expect(ids.slice(0, 3)).toEqual(created.map((order) => order.id).reverse());
    expect(ids).toEqual([...ids].sort((a, b) => b - a));
  });

  it('GET devolve cada item com summary recalculado e sem clientRequestId', async () => {
    const created = (await post({ ...orderInput(), lengthMm: 6000, heightMm: 1530 })).body;

    const response = await list();
    const item = response.body.find((order: { id: number }) => order.id === created.id);

    expect(item).toEqual({
      id: created.id,
      lengthMm: 6000,
      heightMm: 1530,
      color: 'white',
      confirmedAt: created.confirmedAt,
      summary: {
        soldLengthMm: 7500,
        differenceMm: 1500,
        components: { panels: 3, posts: 4, fasteners: 12, screws: 16 },
      },
    });
  });
});
