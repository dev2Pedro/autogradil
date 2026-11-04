import { z } from 'zod';

export const envSchema = z.object({
  PORT: z.coerce
    .number({ error: 'PORT deve ser um número.' })
    .int('PORT deve ser um inteiro.')
    .min(1, 'PORT deve estar entre 1 e 65535.')
    .max(65_535, 'PORT deve estar entre 1 e 65535.')
    .default(3001),
  CORS_ORIGIN: z
    .url({ error: 'CORS_ORIGIN deve ser uma URL, por exemplo http://localhost:3000.' })
    .optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Record<string, unknown> & Env {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    throw new Error(`Variáveis de ambiente inválidas:\n${z.prettifyError(result.error)}`);
  }

  return { ...config, ...result.data };
}
