import type { FenceCalculation, OrderListItem } from '@autogradil/shared';

export function toCalculation(order: OrderListItem): FenceCalculation {
  return {
    requestedLengthMm: order.lengthMm,
    soldLengthMm: order.summary.soldLengthMm,
    differenceMm: order.summary.differenceMm,
    heightMm: order.heightMm,
    components: order.summary.components,
  };
}
