import type { FenceColor } from '@autogradil/shared';

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

export type FencePaint = {
  color: string;
  metalness: number;
  roughness: number;
  clearcoat: number;
};

export const PAINT_BY_COLOR: Record<FenceColor, FencePaint> = {
  none: { color: '#9aa4ab', metalness: 0.9, roughness: 0.38, clearcoat: 0 },
  white: { color: '#eef0f1', metalness: 0.1, roughness: 0.5, clearcoat: 0.35 },
  black: { color: '#1a1d20', metalness: 0.2, roughness: 0.45, clearcoat: 0.45 },
  green: { color: '#1f7a43', metalness: 0.2, roughness: 0.48, clearcoat: 0.4 },
};

export const EDGE_BY_COLOR: Record<FenceColor, string> = {
  none: '#58626a',
  white: '#8e98a0',
  black: '#14181b',
  green: '#14532d',
};
