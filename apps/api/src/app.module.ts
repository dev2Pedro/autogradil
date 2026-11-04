import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { CalculatorModule } from './calculator/calculator.module';
import { OrdersModule } from './orders/orders.module';
import { PrismaModule } from './prisma/prisma.module';
import path from 'path';
import { validateEnv } from './config/env';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: path.resolve(__dirname, '..', '.env'),
      validate: validateEnv,
    }),
    HealthModule,
    CalculatorModule,
    OrdersModule,
    PrismaModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
