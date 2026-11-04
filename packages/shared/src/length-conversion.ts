import { lengthMmSchema } from './schemas';
import type { ParseMetersResult } from './types';

const NUMBER_PATTERN = /^\d+(?:[.,]\d+)?$/;
const METERS_PATTERN = /^\d+(?:[.,]\d{1,3})?$/;

export function parseMetersToMm(input: string): ParseMetersResult {
  const value = input.trim();

  if (value === '') return { ok: false, error: 'empty' };
  if (!NUMBER_PATTERN.test(value)) return { ok: false, error: 'format' };
  if (!METERS_PATTERN.test(value)) return { ok: false, error: 'decimals' };

  const [integer, decimal = ''] = value.replace(',', '.').split('.');
  const parsed = lengthMmSchema.safeParse(Number(integer) * 1000 + Number(decimal.padEnd(3, '0')));

  return parsed.success ? { ok: true, lengthMm: parsed.data } : { ok: false, error: 'range' };
}

export function formatMmToMeters(mm: number): string {
  if (!Number.isInteger(mm) || mm < 0) {
    throw new RangeError('mm deve ser um inteiro não negativo');
  }

  const inteira = Math.floor(mm / 1000);
  const decimal = String(mm % 1000)
    .padStart(3, '0')
    .replace(/0+$/, '');

  return decimal ? `${inteira},${decimal}` : String(inteira);
}
