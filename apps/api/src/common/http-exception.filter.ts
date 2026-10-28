import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

const CODES_BY_STATUS: Record<number, string> = {
  400: 'BAD_REQUEST',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  413: 'PAYLOAD_TOO_LARGE',
};

interface ErrorBody {
  code?: string;
  message?: string;
  fields?: Record<string, string>;
}

interface ClientError {
  status: number;
  message?: string;
}

function isClientError(exception: unknown): exception is ClientError {
  if (typeof exception !== 'object' || exception === null) {
    return false;
  }
  const status = (exception as { status?: unknown }).status;
  return typeof status === 'number' && status >= 400 && status < 500;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'Erro interno do servidor.';
    let fields: Record<string, string> = {};

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      code = CODES_BY_STATUS[status] ?? 'HTTP_ERROR';

      const body = exception.getResponse();

      if (typeof body === 'string') {
        message = body;
      } else {
        const parsed = body as ErrorBody;
        code = parsed.code ?? code;
        message = parsed.message ?? message;
        fields = parsed.fields ?? fields;
      }
    } else if (isClientError(exception)) {
      status = exception.status;
      code = CODES_BY_STATUS[status] ?? 'HTTP_ERROR';
      message =
        status === HttpStatus.PAYLOAD_TOO_LARGE
          ? 'Corpo da requisição maior que 10 kb.'
          : (exception.message ?? 'Requisição inválida.');
    } else {
      this.logger.error(exception);
    }

    response.status(status).json({ error: { code, message, fields } });
  }
}
