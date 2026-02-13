import { GenerationOptions, MealPlan } from '@mealy/engine'

/* ============================================================
   GENERATE MEAL PLAN
============================================================ */

export interface GenerateMealPlanRequest {
	options?: GenerationOptions
}

export interface GenerateMealPlanResponse {
	sessionId: string
	mealPlan: MealPlan
	metadata: {
		tokensUsed: number
		generationTime: number
	}
}


/* ============================================================
   REGENERATE SINGLE MEAL
============================================================ */

export interface RegenerateSingleMealRequest {
	userId: string
	mealId: string
	reason: string
	options?: GenerationOptions
}

export interface RegenerateSingleMealResponse {
	mealPlan: MealPlan
}


/* ============================================================
   REGENERATE FULL PLAN
============================================================ */

export interface RegenerateFullPlanRequest {
	userId: string
	reason: string
	options?: GenerationOptions
}

export interface RegenerateFullPlanResponse {
	mealPlan: MealPlan
}


/* ============================================================
   CONFIRM PLAN
============================================================ */

export interface ConfirmMealPlanRequest {
	userId: string
}

export interface ConfirmMealPlanResponse {
	id: string
	mealPlan: MealPlan
}


/* ============================================================
   HISTORY
============================================================ */

export interface MealPlanHistoryResponse {
	id: string
	mealPlan: MealPlan
}


/* ============================================================
   GENERIC RESPONSE WRAPPERS
============================================================ */

export interface BasicSuccessResponse<T> {
	success: true
	data: T
}

export interface ErrorResponse {
	success: false
	message: string
}
