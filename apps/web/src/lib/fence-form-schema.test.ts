import { describe, expect, it } from 'vitest';
import { fenceFormSchema, toFormFieldErrors } from './fence-form-schema';

function errorsFor(input: { length: string; heightMm: string; color: string }) {
  const result = fenceFormSchema.safeParse(input);
  if (result.success) return {};
  return Object.fromEntries(result.error.issues.map((issue) => [issue.path[0], issue.message]));
}

describe('fenceFormSchema', () => {
  it('converte o formulário na entrada da API', () => {
    expect(fenceFormSchema.parse({ length: '12,5', heightMm: '1530', color: 'green' })).toEqual({
      lengthMm: 12500,
      heightMm: 1530,
      color: 'green',
    });
  });

  it.each([
    ['', 'Informe o comprimento em metros.'],
    ['abc', 'Digite apenas números positivos, por exemplo 12,5.'],
    ['2,5005', 'Use no máximo 3 casas decimais.'],
    ['10.000', 'Use vírgula para os decimais e não use ponto de milhar. Ex.: 1,5 ou 1500.'],
    ['0', 'Informe um valor entre 0,001 m e 10.000 m.'],
  ])('mostra a mensagem certa para o comprimento %j', (length, message) => {
    expect(errorsFor({ length, heightMm: '1530', color: 'green' }).length).toBe(message);
  });

  it('exige altura e cor', () => {
    expect(errorsFor({ length: '5', heightMm: '', color: '' })).toEqual({
      heightMm: 'Escolha a altura.',
      color: 'Escolha a cor.',
    });
  });

  it('rejeita altura e cor fora das opções', () => {
    const errors = errorsFor({ length: '5', heightMm: '1000', color: 'red' });

    expect(errors.heightMm).toBe('Altura inválida. Escolha 1,03, 1,53 ou 2,03 m.');
    expect(errors.color).toBe('Cor inválida. Escolha sem pintura, branca, preta ou verde.');
  });
});

describe('toFormFieldErrors', () => {
  it('leva os erros da API para os campos do formulário', () => {
    expect(
      toFormFieldErrors({
        lengthMm: 'comprimento ruim',
        heightMm: 'altura ruim',
        color: 'cor ruim',
      }),
    ).toEqual({
      errors: { length: 'comprimento ruim', heightMm: 'altura ruim', color: 'cor ruim' },
      unmapped: [],
    });
  });

  it('separa os campos que o formulário não tem', () => {
    expect(toFormFieldErrors({ body: 'corpo inválido', toString: 'x' })).toEqual({
      errors: {},
      unmapped: ['body', 'toString'],
    });
  });
});
