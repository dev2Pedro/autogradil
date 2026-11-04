import { z } from 'zod';
import { FENCE_COLORS, HEIGHTS_MM, MAX_LENGTH_MM, MIN_LENGTH_MM } from './constants';

const LENGTH_MESSAGE = 'Informe um valor entre 0,001 m e 10.000 m.';

export const lengthMmSchema = z
  .number({ error: LENGTH_MESSAGE })
  .int(LENGTH_MESSAGE)
  .min(MIN_LENGTH_MM, LENGTH_MESSAGE)
  .max(MAX_LENGTH_MM, LENGTH_MESSAGE)
  .brand<'LengthMm'>();

export const heightMmSchema = z.literal(HEIGHTS_MM, {
  error: 'Altura inválida. Escolha 1,03, 1,53 ou 2,03 m.',
});

export const colorSchema = z.enum(FENCE_COLORS, {
  error: 'Cor inválida. Escolha sem pintura, branca, preta ou verde.',
});

export const calculateInputSchema = z.object({
  lengthMm: lengthMmSchema,
  heightMm: heightMmSchema,
  color: colorSchema,
});

export const createOrderInputSchema = calculateInputSchema.extend({
  clientRequestId: z.uuid({ error: 'Identificador da requisição inválido.' }),
});

const ORDER_ID_MESSAGE = 'Identificador do pedido inválido.';

const orderIdSchema = z
  .number({ error: ORDER_ID_MESSAGE })
  .int(ORDER_ID_MESSAGE)
  .positive(ORDER_ID_MESSAGE)
  .max(Number.MAX_SAFE_INTEGER, ORDER_ID_MESSAGE);

export const orderIdParamsSchema = z.object({
  id: z.coerce.number({ error: ORDER_ID_MESSAGE }).pipe(orderIdSchema),
});

const quantitySchema = z.number().int().nonnegative();
const millimetersSchema = z.number().int().nonnegative();

export const fenceComponentsSchema = z.object({
  panels: quantitySchema,
  posts: quantitySchema,
  fasteners: quantitySchema,
  screws: quantitySchema,
});

export const fenceCalculationSchema = z.object({
  requestedLengthMm: lengthMmSchema,
  soldLengthMm: millimetersSchema,
  differenceMm: millimetersSchema,
  heightMm: heightMmSchema,
  components: fenceComponentsSchema,
});

export const orderSchema = z.object({
  id: orderIdSchema,
  clientRequestId: z.uuid(),
  lengthMm: lengthMmSchema,
  heightMm: heightMmSchema,
  color: colorSchema,
  confirmedAt: z.iso.datetime(),
});

export const orderSummarySchema = fenceCalculationSchema.pick({
  soldLengthMm: true,
  differenceMm: true,
  components: true,
});

export const orderListItemSchema = orderSchema
  .omit({ clientRequestId: true })
  .extend({ summary: orderSummarySchema });

export const orderListSchema = z.array(orderListItemSchema);

export const apiErrorBodySchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    fields: z.record(z.string(), z.string()).default({}),
  }),
});
