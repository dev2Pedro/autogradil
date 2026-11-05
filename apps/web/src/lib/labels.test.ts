import { describe, expect, it } from 'vitest';
import { formatMeters, formatOrderNumber, formatRelativeDate, plural } from './labels';

describe('formatMeters', () => {
  it.each([
    [1, '0,001 m'],
    [1530, '1,53 m'],
    [2500, '2,5 m'],
    [7500, '7,5 m'],
    [10_000_000, '10.000 m'],
    [1_234_500, '1.234,5 m'],
  ])('formata %i mm como %j', (mm, expected) => {
    expect(formatMeters(mm)).toBe(expected);
  });
});

describe('plural', () => {
  it('usa o singular só para 1', () => {
    expect(plural(1, 'tela', 'telas')).toBe('1 tela');
    expect(plural(0, 'tela', 'telas')).toBe('0 telas');
    expect(plural(4000, 'tela', 'telas')).toBe('4.000 telas');
  });
});

describe('formatOrderNumber', () => {
  it('completa com zeros até 3 dígitos', () => {
    expect(formatOrderNumber(7)).toBe('007');
    expect(formatOrderNumber(42)).toBe('042');
    expect(formatOrderNumber(1234)).toBe('1234');
  });
});

describe('formatRelativeDate', () => {
  const now = new Date(2026, 10, 4, 18, 0);

  it.each([
    ['hoje', new Date(2026, 10, 4, 9, 5), 'Hoje, 09:05'],
    ['ontem', new Date(2026, 10, 3, 23, 59), 'Ontem, 23:59'],
    ['outro dia do ano', new Date(2026, 9, 28, 14, 30), '28 de out, 14:30'],
    ['outro ano', new Date(2025, 0, 5, 8, 0), '05 de jan de 2025, 08:00'],
  ])('formata %s', (_caso, date, expected) => {
    expect(formatRelativeDate(date.toISOString(), now)).toBe(expected);
  });
});
