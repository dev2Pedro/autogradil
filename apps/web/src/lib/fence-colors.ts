import type { FenceColor } from '@autogradil/shared';

export const FILL_BY_COLOR: Record<FenceColor, string> = {
  none: '#a1a1aa',
  white: '#ffffff',
  black: '#18181b',
  green: '#15803d',
};

export const HATCH_BY_COLOR: Record<FenceColor, string> = {
  none: '#52525b',
  white: '#71717a',
  black: '#a1a1aa',
  green: '#bbf7d0',
};

export const WIRE_BY_COLOR: Record<FenceColor, string> = {
  none: '#8b959c',
  white: '#c3cad0',
  black: '#22272c',
  green: '#1d7a42',
};

export const POST_BY_COLOR: Record<FenceColor, string> = {
  none: '#6f7a82',
  white: '#e8ecef',
  black: '#14181b',
  green: '#166534',
};

export const EDGE_BY_COLOR: Record<FenceColor, string> = {
  none: '#58626a',
  white: '#8e98a0',
  black: '#14181b',
  green: '#14532d',
};
