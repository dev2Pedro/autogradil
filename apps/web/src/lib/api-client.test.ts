import { AxiosError, AxiosHeaders } from 'axios';
import { describe, expect, it } from 'vitest';
import { ApiError, toApiError } from './api-client';

function httpError(status: number, data: unknown): AxiosError {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError('falha', 'ERR_BAD_RESPONSE', config, undefined, {
    status,
    statusText: '',
    data,
    headers: {},
    config,
  });
}

function errorBody(code: string, fields: Record<string, string> = {}) {
  return { error: { code, message: `mensagem ${code}`, fields } };
}

describe('toApiError', () => {
  it('trata falta de resposta como erro de rede', () => {
    const error = toApiError(new AxiosError('Network Error', 'ERR_NETWORK'));

    expect(error).toMatchObject({ kind: 'network', code: 'NETWORK_ERROR' });
    expect(error.message).toMatch(/Verifique se a API está rodando/);
  });

  it('mantém código, mensagem e campos de um erro de validação', () => {
    const error = toApiError(
      httpError(400, errorBody('VALIDATION_ERROR', { lengthMm: 'inválido' })),
    );

    expect(error).toMatchObject({
      kind: 'validation',
      code: 'VALIDATION_ERROR',
      message: 'mensagem VALIDATION_ERROR',
      fields: { lengthMm: 'inválido' },
    });
  });

  it.each([
    [400, 'BAD_REQUEST', 'bad_request'],
    [404, 'NOT_FOUND', 'not_found'],
    [409, 'CONFLICT', 'conflict'],
    [413, 'PAYLOAD_TOO_LARGE', 'bad_request'],
    [500, 'INTERNAL_ERROR', 'server'],
  ])('classifica o status %i como %s', (status, code, kind) => {
    expect(toApiError(httpError(status, errorBody(code)))).toMatchObject({
      kind,
      code,
      fields: {},
    });
  });

  it('trata corpo fora do formato padrão como resposta inesperada', () => {
    expect(toApiError(httpError(502, '<html>Bad Gateway</html>'))).toMatchObject({
      kind: 'server',
      code: 'UNEXPECTED_RESPONSE',
    });
  });

  it('trata erros que não vêm do Axios como erro desconhecido', () => {
    expect(toApiError(new TypeError('boom'))).toMatchObject({
      kind: 'server',
      code: 'UNKNOWN_ERROR',
    });
  });

  it('devolve um ApiError sem alterar', () => {
    const original = new ApiError({ kind: 'conflict', code: 'CONFLICT', message: 'já existe' });

    expect(toApiError(original)).toBe(original);
  });
});
