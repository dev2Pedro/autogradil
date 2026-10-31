import { execSync } from 'child_process';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from 'src/app.module';
import { HttpExceptionFilter } from 'src/common/http-exception.filter';
import { PrismaService } from 'src/prisma/prisma.service';

describe('/api/calculate', () => {
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

  it('calcula o cercamento com entrada válida', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/calculate')
      .send({ lengthMm: 6500, heightMm: 1530, color: 'white' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      requestedLengthMm: 6500,
      soldLengthMm: 7500,
      differenceMm: 1000,
      heightMm: 1530,
      components: { panels: 3, posts: 4, fasteners: 12, screws: 16 },
    });
  });

  it('retorna 400 no formato padrão com entrada inválida', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/calculate')
      .send({ lengthMm: -1 });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(Object.keys(response.body.error.fields)).toEqual(
      expect.arrayContaining(['lengthMm', 'heightMm', 'color']),
    );
  });

  it('retorna 400 no formato padrão com JSON malformado', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/calculate')
      .set('Content-Type', 'application/json')
      .send('{"lengthMm": 6500,');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('BAD_REQUEST');
    expect(response.body.error.fields).toEqual({});
  });

  it('calcular não grava pedido no banco', async () => {
    const prisma = app.get(PrismaService);
    const before = await prisma.order.count();

    const response = await request(app.getHttpServer())
      .post('/api/calculate')
      .send({ lengthMm: 6500, heightMm: 1530, color: 'white' });

    expect(response.status).toBe(200);
    expect(await prisma.order.count()).toBe(before);
  });
});
