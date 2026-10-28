import { BadRequestException, PipeTransform } from '@nestjs/common';
import { ZodType } from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodType) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value);

    if (result.success) {
      return result.data;
    }

    const fields: Record<string, string> = {};

    for (const issue of result.error.issues) {
      const campo = issue.path.join('.');
      if (!(campo in fields)) {
        fields[campo] = issue.message;
      }
    }

    throw new BadRequestException({
      code: 'VALIDATION_ERROR',
      message: 'Dados inválidos.',
      fields,
    });
  }
}
