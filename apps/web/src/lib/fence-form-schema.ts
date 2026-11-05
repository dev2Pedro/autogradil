import { z } from 'zod';
import {
  colorSchema,
  heightMmSchema,
  parseMetersToMm,
  type CalculateInput,
  type ParseMetersError,
} from '@autogradil/shared';

const LENGTH_ERROR_MESSAGES: Record<ParseMetersError, string> = {
  empty: 'Informe o comprimento em metros.',
  format: 'Digite apenas números positivos, por exemplo 12,5.',
  decimals: 'Use no máximo 3 casas decimais.',
  ambiguous: 'Use vírgula para os decimais e não use ponto de milhar. Ex.: 1,5 ou 1500.',
  range: 'Informe um valor entre 0,001 m e 10.000 m.',
};

const lengthSchema = z.string().transform((value, ctx) => {
  const result = parseMetersToMm(value);
  if (result.ok) return result.lengthMm;

  ctx.addIssue({ code: 'custom', message: LENGTH_ERROR_MESSAGES[result.error] });
  return z.NEVER;
});

export const fenceFormSchema = z
  .object({
    length: lengthSchema,
    heightMm: z.string().min(1, 'Escolha a altura.').transform(Number).pipe(heightMmSchema),
    color: z.string().min(1, 'Escolha a cor.').pipe(colorSchema),
  })
  .transform(({ length, heightMm, color }): CalculateInput => ({
    lengthMm: length,
    heightMm,
    color,
  }));

export type FenceFormInput = z.input<typeof fenceFormSchema>;
export type FenceFormOutput = z.output<typeof fenceFormSchema>;

export const FENCE_FORM_DEFAULTS: FenceFormInput = { length: '', heightMm: '', color: '' };

export const FORM_FIELDS = ['length', 'heightMm', 'color'] as const satisfies ReadonlyArray<
  keyof FenceFormInput
>;

export type FormField = (typeof FORM_FIELDS)[number];
export type FormFieldErrors = Partial<Record<FormField, string>>;

const API_FIELD_TO_FORM_FIELD = {
  lengthMm: 'length',
  heightMm: 'heightMm',
  color: 'color',
} as const satisfies Record<keyof CalculateInput, FormField>;

function isApiField(field: string): field is keyof typeof API_FIELD_TO_FORM_FIELD {
  return Object.hasOwn(API_FIELD_TO_FORM_FIELD, field);
}

export function toFormFieldErrors(fields: Record<string, string>): {
  errors: FormFieldErrors;
  unmapped: string[];
} {
  const errors: FormFieldErrors = {};
  const unmapped: string[] = [];

  for (const [field, message] of Object.entries(fields)) {
    if (isApiField(field)) {
      errors[API_FIELD_TO_FORM_FIELD[field]] = message;
    } else {
      unmapped.push(field);
    }
  }

  return { errors, unmapped };
}
