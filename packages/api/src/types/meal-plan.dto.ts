import { GenerationOptions } from '@mealy/engine'
import { MealPlan } from '@mealy/engine'

/* ============================================================
   REQUEST DTOs
============================================================ */

export interface GenerateMealPlanRequest {
  userId: string
  options?: GenerationOptions
}

export interface RegenerateSingleMealRequest {
  userId: string
  mealId: string
  reason: string
  options?: GenerationOptions
}

export interface RegenerateFullPlanRequest {
  userId: string
  reason: string
  options?: GenerationOptions
}

export interface ConfirmMealPlanRequest {
  userId: string
}

/* ============================================================
   RESPONSE DTOs
============================================================ */

export interface GenerateMealPlanResponse {
  sessionId: string
  mealPlan: MealPlan
  metadata: {
    tokensUsed: number
    generationTime: number
  }
}

export interface BasicSuccessResponse<T> {
  success: true
  data: T
}

export interface ErrorResponse {
  success: false
  message: string
}
