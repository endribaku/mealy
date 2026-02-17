import { FullContext } from '../context-builder.js'
import { MealPlan } from '../schemas/schemas.js'
import {
  GenerationOptions,
  GenerationResult
} from '../meal-plan/meal-plan-generator.js'

export interface IMealPlanGenerator {

  generateMealPlan(
    context: FullContext,
    options?: GenerationOptions
  ): Promise<GenerationResult>

  regenerateSingleMeal(
    context: FullContext,
    mealId: string,
    rejectionReason: string,
    options?: GenerationOptions
  ): Promise<GenerationResult>

  regenerateFullPlan(
    context: FullContext,
    regenerationReason: string,
    options?: GenerationOptions
  ): Promise<GenerationResult>
}
