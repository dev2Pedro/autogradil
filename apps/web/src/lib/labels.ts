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
  conflict: 'Conflito ao salvar',
  server: 'Erro no servidor',
};
