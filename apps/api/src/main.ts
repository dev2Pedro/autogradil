import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { HttpExceptionFilter } from './common/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  const config = app.get(ConfigService);
  const port = Number(config.get('PORT', '3001'));
  const corsOrigin = config.get<string>('CORS_ORIGIN');

  app.useBodyParser('json', { limit: '10kb' });
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new HttpExceptionFilter());

  if (corsOrigin) {
    app.enableCors({ origin: corsOrigin });
  }

  await app.listen(port);

  new Logger('Bootstrap').log(`API rodando em http://localhost:${port}/api`);
}
bootstrap();
