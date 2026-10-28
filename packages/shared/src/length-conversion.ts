import { MIN_LENGTH_MM, MAX_LENGTH_MM } from './constants';

const METERS_PATTERN = /^\d+(?:[.,]\d{1,3})?$/;

export function parseMetersToMm(input: string): number | null {
  const normalizado = input.trim();
  if (!METERS_PATTERN.test(normalizado)) {
    return null;
  }

  const [inteira, decimal = ''] = normalizado.replace(',', '.').split('.');
  const mm = Number(inteira) * 1000 + Number(decimal.padEnd(3, '0'));

  if (mm < MIN_LENGTH_MM || mm > MAX_LENGTH_MM) {
    return null;
  }
  return mm;
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
