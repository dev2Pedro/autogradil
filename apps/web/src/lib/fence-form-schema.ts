import { z } from 'zod';
import { colorSchema, heightMmSchema, parseMetersToMm } from '@autogradil/shared';

const NUMBER_PATTERN = /^\d+(?:[.,]\d+)?$/;
const DECIMALS_PATTERN = /^\d+(?:[.,]\d{1,3})?$/;

const lengthSchema = z.string().transform((value, ctx) => {
  const trimmed = value.trim();

  if (!trimmed) {
    ctx.addIssue({ code: 'custom', message: 'Informe o comprimento em metros.' });
    return z.NEVER;
  }
  if (!NUMBER_PATTERN.test(trimmed)) {
    ctx.addIssue({ code: 'custom', message: 'Digite apenas números positivos, por exemplo 12,5.' });
    return z.NEVER;
  }
  if (!DECIMALS_PATTERN.test(trimmed)) {
    ctx.addIssue({ code: 'custom', message: 'Use no máximo 3 casas decimais.' });
    return z.NEVER;
  }

  const lengthMm = parseMetersToMm(trimmed);
  if (lengthMm === null) {
    ctx.addIssue({ code: 'custom', message: 'Informe um valor entre 0,001 m e 10.000 m.' });
    return z.NEVER;
  }
  return lengthMm;
});

export const fenceFormSchema = z
  .object({
    length: lengthSchema,
    heightMm: z.string().min(1, 'Escolha a altura.').transform(Number).pipe(heightMmSchema),
    color: z.string().min(1, 'Escolha a cor.').pipe(colorSchema),
  })
  .transform(({ length, heightMm, color }) => ({ lengthMm: length, heightMm, color }));

export type FenceFormInput = z.input<typeof fenceFormSchema>;
export type FenceFormOutput = z.output<typeof fenceFormSchema>;

export const FENCE_FORM_DEFAULTS: FenceFormInput = { length: '', heightMm: '', color: '' };

export const API_FIELD_TO_FORM_FIELD: Record<string, keyof FenceFormInput> = {
  lengthMm: 'length',
  heightMm: 'heightMm',
  color: 'color',
};
