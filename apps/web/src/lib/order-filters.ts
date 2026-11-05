import type { FenceColor, OrderListItem } from '@autogradil/shared';

export type SortKey = 'recent' | 'oldest' | 'longest' | 'shortest';

export const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: 'recent', label: 'Mais recentes' },
  { value: 'oldest', label: 'Mais antigos' },
  { value: 'longest', label: 'Maior comprimento' },
  { value: 'shortest', label: 'Menor comprimento' },
];

const SORTERS: Record<SortKey, (a: OrderListItem, b: OrderListItem) => number> = {
  recent: (a, b) => b.confirmedAt.localeCompare(a.confirmedAt) || b.id - a.id,
  oldest: (a, b) => a.confirmedAt.localeCompare(b.confirmedAt) || a.id - b.id,
  longest: (a, b) => b.summary.soldLengthMm - a.summary.soldLengthMm || b.id - a.id,
  shortest: (a, b) => a.summary.soldLengthMm - b.summary.soldLengthMm || a.id - b.id,
};

export type OrderFilters = {
  color: FenceColor | null;
  query: string;
  sort: SortKey;
};

export function isSortKey(value: unknown): value is SortKey {
  return SORT_OPTIONS.some((option) => option.value === value);
}

export function orderNumberQuery(query: string): string {
  return query.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
}

export function hasActiveFilters({ color, query }: Pick<OrderFilters, 'color' | 'query'>): boolean {
  return color !== null || orderNumberQuery(query) !== '';
}

export function filterOrders(orders: OrderListItem[], { color, query, sort }: OrderFilters) {
  const number = orderNumberQuery(query);
  return orders
    .filter((order) => color === null || order.color === color)
    .filter((order) => number === '' || String(order.id).includes(number))
    .sort(SORTERS[sort]);
}
