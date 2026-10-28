import type { z } from 'zod';
import type { HeightMm } from './constants';
import type { calculateInputSchema, createOrderInputSchema } from './schemas';

export type CalculateInput = z.infer<typeof calculateInputSchema>;
export type CreateOrderInput = z.infer<typeof createOrderInputSchema>;

export interface CalculateFenceInput {
  lengthMm: number;
  heightMm: HeightMm;
}

export interface FenceComponents {
  panels: number;
  posts: number;
  fasteners: number;
  screws: number;
}

export interface FenceCalculation {
  requestedLengthMm: number;
  soldLengthMm: number;
  differenceMm: number;
  heightMm: HeightMm;
  components: FenceComponents;
}
