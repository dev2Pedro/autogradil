import { z } from 'zod';
import { FENCE_COLORS, HEIGHTS_MM, MAX_LENGTH_MM, MIN_LENGTH_MM } from './constants';

const LENGTH_MESSAGE = 'Informe um valor entre 0,001 m e 10.000 m.';

export const lengthMmSchema = z
  .number({ error: LENGTH_MESSAGE })
  .int(LENGTH_MESSAGE)
  .min(MIN_LENGTH_MM, LENGTH_MESSAGE)
  .max(MAX_LENGTH_MM, LENGTH_MESSAGE);

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

export const apiErrorBodySchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    fields: z.record(z.string(), z.string()).default({}),
  }),
});
