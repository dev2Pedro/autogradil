import { describe, expect, it } from 'vitest';
import { calculateFence } from './fence-calculator';
import { parseMetersToMm } from './length-conversion';
import { HEIGHTS_MM, type HeightMm } from './constants';

function calculate(lengthMeters: string, heightMm: HeightMm) {
  const lengthMm = parseMetersToMm(lengthMeters);
  if (lengthMm === null) {
    throw new Error(`comprimento inválido no teste: ${lengthMeters}`);
  }
  return calculateFence({ lengthMm, heightMm });
}

describe('calculateFence', () => {
  it.each([
    ['2,5', 1030, { panels: 1, posts: 2, fasteners: 3, screws: 8 }, 2500, 0],
    ['6', 1530, { panels: 3, posts: 4, fasteners: 12, screws: 16 }, 7500, 1500],
    ['5', 2030, { panels: 2, posts: 3, fasteners: 12, screws: 12 }, 5000, 0],
    ['5,1', 1030, { panels: 3, posts: 4, fasteners: 9, screws: 16 }, 7500, 2400],
    ['6,5', 2030, { panels: 3, posts: 4, fasteners: 18, screws: 16 }, 7500, 1000],
    ['6,125', 1530, { panels: 3, posts: 4, fasteners: 12, screws: 16 }, 7500, 1375],
    ['0,001', 1030, { panels: 1, posts: 2, fasteners: 3, screws: 8 }, 2500, 2499],
    ['7,5', 1530, { panels: 3, posts: 4, fasteners: 12, screws: 16 }, 7500, 0],
    ['10000', 1030, { panels: 4000, posts: 4001, fasteners: 12000, screws: 16004 }, 10_000_000, 0],
  ] as const)(
    '%s m com altura %i mm',
    (lengthMeters, heightMm, components, soldLengthMm, differenceMm) => {
      const result = calculate(lengthMeters, heightMm);

      expect(result.components).toEqual(components);
      expect(result.soldLengthMm).toBe(soldLengthMm);
      expect(result.differenceMm).toBe(differenceMm);
    },
  );

  it('devolve o comprimento solicitado e a altura recebidos', () => {
    expect(calculateFence({ lengthMm: 6000, heightMm: 1530 })).toMatchObject({
      requestedLengthMm: 6000,
      heightMm: 1530,
    });
  });

  it('nunca vende menos do que o solicitado', () => {
    for (const heightMm of HEIGHTS_MM) {
      for (let lengthMm = 1; lengthMm <= 12_500; lengthMm += 37) {
        const result = calculateFence({ lengthMm, heightMm });

        expect(result.soldLengthMm).toBeGreaterThanOrEqual(lengthMm);
        expect(result.differenceMm).toBeLessThan(2500);
        expect(result.soldLengthMm - result.differenceMm).toBe(lengthMm);
      }
    }
  });

  it('não altera a entrada', () => {
    const input = Object.freeze({ lengthMm: 6000, heightMm: 1530 as HeightMm });

    expect(() => calculateFence(input)).not.toThrow();
  });
});
