import { describe, expect, it } from 'vitest';
import { foldPositions } from './fence-folds';

describe('foldPositions', () => {
  it.each([
    [1.03, 2],
    [1.53, 3],
    [2.03, 4],
  ])('a tela de %f m tem %i dobras', (heightM, folds) => {
    expect(foldPositions(heightM)).toHaveLength(folds);
  });

  it('distribui as dobras igualmente, sem encostar nas bordas', () => {
    expect(foldPositions(2.03)).toEqual([0.125, 0.375, 0.625, 0.875]);
  });

  it('usa pelo menos 2 dobras em telas baixas', () => {
    expect(foldPositions(0.4)).toEqual([0.25, 0.75]);
  });
});
