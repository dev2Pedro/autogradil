import type { z } from 'zod';
import type {
  apiErrorBodySchema,
  calculateInputSchema,
  createOrderInputSchema,
  fenceCalculationSchema,
  fenceComponentsSchema,
  lengthMmSchema,
  orderIdParamsSchema,
  orderListItemSchema,
  orderSchema,
  orderSummarySchema,
} from './schemas';

export type LengthMm = z.infer<typeof lengthMmSchema>;
export type CalculateInput = z.infer<typeof calculateInputSchema>;
export type CreateOrderInput = z.infer<typeof createOrderInputSchema>;
export type OrderIdParams = z.infer<typeof orderIdParamsSchema>;
export type CalculateFenceInput = Pick<CalculateInput, 'lengthMm' | 'heightMm'>;
export type FenceComponents = z.infer<typeof fenceComponentsSchema>;
export type FenceCalculation = z.infer<typeof fenceCalculationSchema>;
export type OrderSummary = z.infer<typeof orderSummarySchema>;
export type Order = z.infer<typeof orderSchema>;
export type OrderListItem = z.infer<typeof orderListItemSchema>;
export type ApiErrorBody = z.infer<typeof apiErrorBodySchema>;

export type ParseMetersError = 'empty' | 'format' | 'decimals' | 'range';

export type ParseMetersResult =
  { ok: true; lengthMm: LengthMm } | { ok: false; error: ParseMetersError };
