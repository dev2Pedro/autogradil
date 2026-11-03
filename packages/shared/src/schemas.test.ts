import { describe, expect, it } from 'vitest';
import { apiErrorBodySchema, calculateInputSchema, createOrderInputSchema } from './schemas';
import { MAX_LENGTH_MM, MIN_LENGTH_MM } from './constants';

const VALID_UUID = '3f2b8c1e-6d4a-4b7e-9c2f-1a5d8e7b9c03';
const LENGTH_MESSAGE = 'Informe um valor entre 0,001 m e 10.000 m.';

function messageFor(
  result: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } },
  field: string,
) {
  return result.error?.issues.find((issue) => issue.path[0] === field)?.message;
}

describe('calculateInputSchema', () => {
  it.each([
    [{ lengthMm: 6000, heightMm: 1530, color: 'white' }],
    [{ lengthMm: MIN_LENGTH_MM, heightMm: 1030, color: 'none' }],
    [{ lengthMm: MAX_LENGTH_MM, heightMm: 2030, color: 'green' }],
    [{ lengthMm: 2500, heightMm: 1030, color: 'black' }],
  ])('aceita %j', (input) => {
    const result = calculateInputSchema.safeParse(input);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(input);
  });

  it.each([
    ['zero', 0],
    ['negativo', -1],
    ['fracionário', 1.5],
    ['acima do limite', MAX_LENGTH_MM + 1],
    ['texto', '6500'],
    ['ausente', undefined],
    ['NaN', Number.NaN],
  ])('rejeita lengthMm %s com mensagem em português', (_nome, lengthMm) => {
    const result = calculateInputSchema.safeParse({ lengthMm, heightMm: 1530, color: 'white' });

    expect(result.success).toBe(false);
    expect(messageFor(result, 'lengthMm')).toBe(LENGTH_MESSAGE);
  });

  it.each([
    ['fora das opções', 1000],
    ['texto', '1530'],
    ['ausente', undefined],
  ])('rejeita heightMm %s', (_nome, heightMm) => {
    const result = calculateInputSchema.safeParse({ lengthMm: 6000, heightMm, color: 'white' });

    expect(result.success).toBe(false);
    expect(messageFor(result, 'heightMm')).toBe('Altura inválida. Escolha 1,03, 1,53 ou 2,03 m.');
  });

  it.each([
    ['fora das opções', 'red'],
    ['maiúscula', 'WHITE'],
    ['número', 1],
    ['ausente', undefined],
  ])('rejeita color %s', (_nome, color) => {
    const result = calculateInputSchema.safeParse({ lengthMm: 6000, heightMm: 1530, color });

    expect(result.success).toBe(false);
    expect(messageFor(result, 'color')).toBe(
      'Cor inválida. Escolha sem pintura, branca, preta ou verde.',
    );
  });

  it('rejeita entrada que não é objeto', () => {
    expect(calculateInputSchema.safeParse(null).success).toBe(false);
  });
});

describe('createOrderInputSchema', () => {
  const base = { lengthMm: 6000, heightMm: 1530, color: 'white' };

  it('aceita os campos do cálculo mais clientRequestId UUID', () => {
    const result = createOrderInputSchema.safeParse({ ...base, clientRequestId: VALID_UUID });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ ...base, clientRequestId: VALID_UUID });
  });

  it.each([
    ['texto livre', 'abc'],
    ['vazio', ''],
    ['número', 123],
    ['ausente', undefined],
  ])('rejeita clientRequestId %s', (_nome, clientRequestId) => {
    const result = createOrderInputSchema.safeParse({ ...base, clientRequestId });

    expect(result.success).toBe(false);
    expect(messageFor(result, 'clientRequestId')).toBe('Identificador da requisição inválido.');
  });

  it('continua validando os campos do cálculo', () => {
    const result = createOrderInputSchema.safeParse({
      ...base,
      lengthMm: 0,
      clientRequestId: VALID_UUID,
    });

    expect(result.success).toBe(false);
    expect(messageFor(result, 'lengthMm')).toBe(LENGTH_MESSAGE);
  });
});

describe('apiErrorBodySchema', () => {
  it('aceita o corpo de erro padrão da API', () => {
    const body = {
      error: { code: 'VALIDATION_ERROR', message: 'Dados inválidos.', fields: { lengthMm: 'x' } },
    };

    expect(apiErrorBodySchema.safeParse(body).data).toEqual(body);
  });

  it('usa fields vazio quando ausente', () => {
    const result = apiErrorBodySchema.safeParse({ error: { code: 'X', message: 'y' } });

    expect(result.data?.error.fields).toEqual({});
  });

  it.each([
    ['html', '<html></html>'],
    ['nulo', null],
    ['sem error', { message: 'x' }],
  ])('rejeita corpo %s', (_nome, body) => {
    expect(apiErrorBodySchema.safeParse(body).success).toBe(false);
  });
});
