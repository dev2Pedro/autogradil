import type { z } from 'zod';
import type { FenceColor, HeightMm } from './constants';
import type {
  apiErrorBodySchema,
  calculateInputSchema,
  createOrderInputSchema,
  orderIdParamsSchema,
} from './schemas';

export type CalculateInput = z.infer<typeof calculateInputSchema>;
export type CreateOrderInput = z.infer<typeof createOrderInputSchema>;
export type OrderIdParams = z.infer<typeof orderIdParamsSchema>;

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

export interface OrderSummary {
  soldLengthMm: number;
  differenceMm: number;
  components: FenceComponents;
}

export interface Order {
  id: number;
  clientRequestId: string;
  lengthMm: number;
  heightMm: HeightMm;
  color: FenceColor;
  confirmedAt: string;
}

export interface OrderListItem extends Omit<Order, 'clientRequestId'> {
  summary: OrderSummary;
}

export type ApiErrorBody = z.infer<typeof apiErrorBodySchema>;
