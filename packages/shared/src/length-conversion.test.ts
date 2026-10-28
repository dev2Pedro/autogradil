import { describe, expect, it } from 'vitest';
import { formatMmToMeters, parseMetersToMm } from './length-conversion';
import { MAX_LENGTH_MM, MIN_LENGTH_MM } from './constants';

describe('parseMetersToMm', () => {
  it('should convert meters to millimeters', () => {
    expect(parseMetersToMm('6,5')).toBe(6500);
  });

  it.each([
    ['6,5', 6500],
    ['6.5', 6500],
    ['6', 6000],
    ['0,5', 500],
    ['2,03', 2030],
    ['2,5', 2500],
    ['6,125', 6125],
    ['0,001', MIN_LENGTH_MM],
    ['10000', MAX_LENGTH_MM],
    ['10.000', 10000],
    ['  6,5  ', 6500],
  ])('converte %j para %i mm', (input, expected) => {
    expect(parseMetersToMm(input)).toBe(expected);
  });

  it.each([
    ['vazio', ''],
    ['só espaços', '   '],
    ['texto', 'abc'],
    ['texto após o número', '6,5abc'],
    ['notação científica', '1e3'],
    ['negativo', '-1'],
    ['negativo decimal', '-0,5'],
    ['sinal positivo', '+6'],
    ['zero', '0'],
    ['zero com decimais', '0,000'],
    ['4 casas decimais', '2,5005'],
    ['acima do limite', '10000,001'],
    ['ponto e vírgula juntos', '10.000,001'],
    ['dois separadores iguais', '1,2,3'],
    ['vírgula sem decimais', '6,'],
    ['vírgula sem inteiro', ',5'],
    ['espaço no meio', '6 5'],
    ['número gigante', '99999999999999999999'],
  ])('rejeita %s', (_nome, input) => {
    expect(parseMetersToMm(input)).toBeNull();
  });
});

describe('formatMmToMeters', () => {
  it.each([
    [6500, '6,5'],
    [2030, '2,03'],
    [1, '0,001'],
    [500, '0,5'],
    [6000, '6'],
    [2500, '2,5'],
    [1375, '1,375'],
    [10000, '10'],
    [MAX_LENGTH_MM, '10000'],
  ])('formata %i mm como %j', (mm, expected) => {
    expect(formatMmToMeters(mm)).toBe(expected);
  });

  it.each([
    ['negativo', -1],
    ['fracionário', 1.5],
    ['NaN', Number.NaN],
  ])('lança RangeError para %s', (_nome, mm) => {
    expect(() => formatMmToMeters(mm)).toThrow(RangeError);
  });
});

describe('ida e volta', () => {
  it.each([MIN_LENGTH_MM, 500, 1375, 2030, 2500, 6500, 10000, MAX_LENGTH_MM])(
    'parse(format(%i)) devolve o mesmo valor',
    (mm) => {
      expect(parseMetersToMm(formatMmToMeters(mm))).toBe(mm);
    },
  );
});
