import { describe, expect, it } from 'vitest';
import {
  calculateFence,
  lengthMmSchema,
  type FenceColor,
  type OrderListItem,
} from '@autogradil/shared';
import { filterOrders, hasActiveFilters, isSortKey, orderNumberQuery } from './order-filters';

function order(
  id: number,
  color: FenceColor,
  lengthMm: number,
  confirmedAt: string,
): OrderListItem {
  const length = lengthMmSchema.parse(lengthMm);
  const { soldLengthMm, differenceMm, components } = calculateFence({
    lengthMm: length,
    heightMm: 1530,
  });
  return {
    id,
    color,
    lengthMm: length,
    heightMm: 1530,
    confirmedAt,
    summary: { soldLengthMm, differenceMm, components },
  };
}

const ORDERS = [
  order(1, 'green', 5000, '2026-11-01T10:00:00.000Z'),
  order(12, 'white', 12_000, '2026-11-03T10:00:00.000Z'),
  order(7, 'green', 2500, '2026-11-02T10:00:00.000Z'),
  order(21, 'black', 7500, '2026-11-03T10:00:00.000Z'),
];

function ids(orders: OrderListItem[]) {
  return orders.map((item) => item.id);
}

describe('filterOrders', () => {
  it.each([
    ['recent', [21, 12, 7, 1]],
    ['oldest', [1, 7, 12, 21]],
    ['longest', [12, 21, 1, 7]],
    ['shortest', [7, 1, 21, 12]],
  ] as const)('ordena por %s, desempatando pelo número', (sort, expected) => {
    expect(ids(filterOrders(ORDERS, { color: null, query: '', sort }))).toEqual(expected);
  });

  it('filtra pela cor', () => {
    expect(ids(filterOrders(ORDERS, { color: 'green', query: '', sort: 'recent' }))).toEqual([
      7, 1,
    ]);
  });

  it('busca pelo número ignorando zeros à esquerda e o que não é dígito', () => {
    expect(ids(filterOrders(ORDERS, { color: null, query: 'nº 007', sort: 'recent' }))).toEqual([
      7,
    ]);
    expect(ids(filterOrders(ORDERS, { color: null, query: '1', sort: 'recent' }))).toEqual([
      21, 12, 1,
    ]);
  });

  it('combina cor e busca', () => {
    expect(ids(filterOrders(ORDERS, { color: 'white', query: '2', sort: 'recent' }))).toEqual([12]);
  });

  it('não altera a lista original', () => {
    const original = [...ORDERS];
    filterOrders(ORDERS, { color: null, query: '', sort: 'oldest' });

    expect(ORDERS).toEqual(original);
  });
});

describe('orderNumberQuery e hasActiveFilters', () => {
  it.each([
    ['', ''],
    ['abc', ''],
    ['007', '7'],
    ['000', '0'],
    [' nº 12 ', '12'],
  ])('extrai %j como %j', (query, expected) => {
    expect(orderNumberQuery(query)).toBe(expected);
  });

  it('só considera filtro ativo quando há cor ou dígitos na busca', () => {
    expect(hasActiveFilters({ color: null, query: '' })).toBe(false);
    expect(hasActiveFilters({ color: null, query: 'abc' })).toBe(false);
    expect(hasActiveFilters({ color: null, query: '7' })).toBe(true);
    expect(hasActiveFilters({ color: 'black', query: '' })).toBe(true);
  });
});

describe('isSortKey', () => {
  it('aceita só as ordenações conhecidas', () => {
    expect(isSortKey('recent')).toBe(true);
    expect(isSortKey('random')).toBe(false);
    expect(isSortKey(null)).toBe(false);
  });
});
