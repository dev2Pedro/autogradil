export const PANEL_LENGTH_MM = 2500;
export const SCREWS_PER_POST = 4;

export const HEIGHTS_MM = [1030, 1530, 2030] as const;
export type HeightMm = (typeof HEIGHTS_MM)[number];

export const FASTENERS_BY_HEIGHT_MM = {
  1030: 3,
  1530: 4,
  2030: 6,
} satisfies Record<HeightMm, number>;

export const FENCE_COLORS = ['none', 'white', 'black', 'green'] as const;
export type FenceColor = (typeof FENCE_COLORS)[number];

export const MIN_LENGTH_MM = 1;
export const MAX_LENGTH_MM = 10_000_000;
