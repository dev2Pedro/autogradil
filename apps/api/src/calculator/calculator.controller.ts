import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { CalculatorService } from "./calculator.service";
import { ZodValidationPipe } from "src/common/zod-validation.pipe";
import { calculateInputSchema, type CalculateInput, type FenceCalculation } from "@autogradil/shared";


@Controller('calculate')
export class CalculatorController{
  constructor(private readonly calculatorService: CalculatorService) {}

    @Post()
    @HttpCode(200)
    calculate(
      @Body(new ZodValidationPipe(calculateInputSchema)) input: CalculateInput,
    ): FenceCalculation {
      return this.calculatorService.calculate(input);
    }
}
