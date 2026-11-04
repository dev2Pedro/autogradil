import type { ApiErrorKind } from '@/lib/api-client';
import {
  HEIGHTS_MM,
  FENCE_COLORS,
  formatMmToMeters,
  type FenceColor,
  type HeightMm,
} from '@autogradil/shared';

export const COLOR_LABELS: Record<FenceColor, string> = {
  none: 'Sem pintura',
  white: 'Branca',
  black: 'Preta',
  green: 'Verde',
};

const integerFormat = new Intl.NumberFormat('pt-BR');

export function formatMeters(mm: number): string {
  const [integer, decimal] = formatMmToMeters(mm).split(',');
  const formatted = integerFormat.format(Number(integer));
  return decimal ? `${formatted},${decimal} m` : `${formatted} m`;
}

const dateTimeFormat = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
});

export function formatDateTime(iso: string): string {
  return dateTimeFormat.format(new Date(iso));
}

const timeFormat = new Intl.DateTimeFormat('pt-BR', { timeStyle: 'short' });
const dayFormat = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' });
const dayYearFormat = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function formatRelativeDate(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const days = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);
  const time = timeFormat.format(date);
  if (days === 0) return `Hoje, ${time}`;
  if (days === 1) return `Ontem, ${time}`;
  const format = date.getFullYear() === now.getFullYear() ? dayFormat : dayYearFormat;
  return `${format.format(date).replace('.', '')}, ${time}`;
}

export function formatQuantity(count: number): string {
  return integerFormat.format(count);
}

export function plural(count: number, singular: string, pluralForm: string): string {
  return `${formatQuantity(count)} ${count === 1 ? singular : pluralForm}`;
}

export function formatOrderNumber(id: number): string {
  return String(id).padStart(3, '0');
}

export const HEIGHT_OPTIONS = HEIGHTS_MM.map((heightMm: HeightMm) => ({
  value: String(heightMm),
  label: formatMeters(heightMm),
}));

export const COLOR_OPTIONS = FENCE_COLORS.map((color) => ({
  value: color,
  label: COLOR_LABELS[color],
}));

export const API_ERROR_TITLES: Record<ApiErrorKind, string> = {
  network: 'Sem conexão com o servidor',
  validation: 'Dados inválidos',
  not_found: 'Não encontrado',
  conflict: 'Conflito ao salvar',
  server: 'Erro no servidor',
};
