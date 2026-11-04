import { lengthMmSchema } from '@autogradil/shared';
import { CalculatorService } from './calculator.service';

describe('CalculatorService', () => {
  const service = new CalculatorService();

  it('arredonda o comprimento para cima ao múltiplo de uma tela', () => {
    expect(
      service.calculate({
        lengthMm: lengthMmSchema.parse(6500),
        heightMm: 1530,
        color: 'white',
      }),
    ).toEqual({
      requestedLengthMm: 6500,
      soldLengthMm: 7500,
      differenceMm: 1000,
      heightMm: 1530,
      components: {
        panels: 3,
        posts: 4,
        fasteners: 12,
        screws: 16,
      },
    });
  });

  it('não gera diferença quando o comprimento é múltiplo exato de uma tela', () => {
    const result = service.calculate({
      lengthMm: lengthMmSchema.parse(5000),
      heightMm: 1030,
      color: 'none',
    });

    expect(result.differenceMm).toBe(0);
    expect(result.components).toEqual({ panels: 2, posts: 3, fasteners: 6, screws: 12 });
  });
});
