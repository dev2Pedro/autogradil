import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { ApiErrorBody } from '@autogradil/shared';
import type { Response } from 'express';
import { z } from 'zod';

const CODES_BY_STATUS: Record<number, string> = {
  400: 'BAD_REQUEST',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  413: 'PAYLOAD_TOO_LARGE',
};

const MESSAGES_BY_STATUS: Record<number, string> = {
  400: 'Requisição inválida. Envie um JSON válido.',
  404: 'Recurso não encontrado.',
  413: 'Corpo da requisição maior que 10 kb.',
};

const appExceptionBodySchema = z.object({
  code: z.string(),
  message: z.union([z.string(), z.array(z.string())]),
  fields: z.record(z.string(), z.string()).default({}),
});

const clientErrorSchema = z.object({
  status: z.number().int().min(400).max(499),
});

type ErrorDetails = ApiErrorBody['error'];

function frameworkError(status: number): ErrorDetails {
  const fallback =
    status >= HttpStatus.INTERNAL_SERVER_ERROR
      ? 'Erro interno do servidor.'
      : 'Requisição inválida.';
  return {
    code: CODES_BY_STATUS[status] ?? 'HTTP_ERROR',
    message: MESSAGES_BY_STATUS[status] ?? fallback,
    fields: {},
  };
}

function fromHttpException(exception: HttpException): { status: number; error: ErrorDetails } {
  const status = exception.getStatus();
  const parsed = appExceptionBodySchema.safeParse(exception.getResponse());

  if (!parsed.success) {
    return { status, error: frameworkError(status) };
  }

  const { code, message, fields } = parsed.data;
  return {
    status,
    error: { code, message: Array.isArray(message) ? message.join(' ') : message, fields },
  };
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const { status, error } = fromHttpException(exception);
      response.status(status).json({ error } satisfies ApiErrorBody);
      return;
    }

    const clientError = clientErrorSchema.safeParse(exception);
    if (clientError.success) {
      const { status } = clientError.data;
      response.status(status).json({ error: frameworkError(status) } satisfies ApiErrorBody);
      return;
    }

    this.logger.error(exception);
    const error: ErrorDetails = {
      code: 'INTERNAL_ERROR',
      message: 'Erro interno do servidor.',
      fields: {},
    };
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error } satisfies ApiErrorBody);
  }
}
