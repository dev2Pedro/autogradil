import { Injectable } from '@nestjs/common';
import { calculateFence } from '@autogradil/shared';
import type { CalculateInput, FenceCalculation } from '@autogradil/shared';

@Injectable()
export class CalculatorService {
  calculate({ lengthMm, heightMm }: CalculateInput): FenceCalculation {
    return calculateFence({ lengthMm, heightMm });
  }
}
