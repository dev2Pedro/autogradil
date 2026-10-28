import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { CalculatorModule } from './calculator/calculator.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HealthModule,
    CalculatorModule,
    OrdersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
