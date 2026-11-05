import { validateEnv } from './env';

describe('validateEnv', () => {
  it('aceita DATABASE_URL e aplica o padrão de PORT', () => {
    expect(validateEnv({ DATABASE_URL: 'file:./dev.db' })).toMatchObject({
      DATABASE_URL: 'file:./dev.db',
      PORT: 3001,
    });
  });

  it.each([undefined, ''])('rejeita DATABASE_URL ausente ou vazia (%p)', (value) => {
    expect(() => validateEnv({ DATABASE_URL: value })).toThrow(/DATABASE_URL é obrigatória/);
  });

  it('rejeita PORT inválida', () => {
    expect(() => validateEnv({ DATABASE_URL: 'file:./dev.db', PORT: 'abc' })).toThrow(/PORT/);
  });
});
