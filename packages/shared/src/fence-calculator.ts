import { FASTENERS_BY_HEIGHT_MM, PANEL_LENGTH_MM, SCREWS_PER_POST } from './constants';
import type { CalculateFenceInput, FenceCalculation } from './types';

export function calculateFence({ lengthMm, heightMm }: CalculateFenceInput): FenceCalculation {
  const panels = Math.ceil(lengthMm / PANEL_LENGTH_MM);
  const soldLengthMm = panels * PANEL_LENGTH_MM;
  const posts = panels + 1;

  return {
    requestedLengthMm: lengthMm,
    soldLengthMm,
    differenceMm: soldLengthMm - lengthMm,
    heightMm,
    components: {
      panels,
      posts,
      fasteners: panels * FASTENERS_BY_HEIGHT_MM[heightMm],
      screws: posts * SCREWS_PER_POST,
    },
  };
}
