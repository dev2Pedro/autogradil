const FOLD_SPACING_M = 0.5;
const MIN_FOLDS = 2;

export function foldPositions(heightM: number): number[] {
  const folds = Math.max(MIN_FOLDS, Math.round(heightM / FOLD_SPACING_M));
  return Array.from({ length: folds }, (_, index) => (index + 0.5) / folds);
}
