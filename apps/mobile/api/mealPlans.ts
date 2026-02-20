import { api, aiApi } from '../lib/api'
import {
  ApiResponse,
  GenerationOptions,
  GenerateMealPlanResponseData,
  RegenerateSingleMealResponseData,
  RegenerateFullPlanResponseData,
  ConfirmMealPlanResponseData,
  StoredMealPlan
} from './types'

// POST /meal-plans
export async function generateMealPlan(
  options?: GenerationOptions,
  signal?: AbortSignal
) {
  const res = await aiApi.post<ApiResponse<GenerateMealPlanResponseData>>(
    '/meal-plans',
    { options },
    { signal }
  )

  return res.data.data
}

// GET /meal-plans
export async function getMealPlans(signal?: AbortSignal) {
  const res = await api.get<ApiResponse<StoredMealPlan[]>>(
    '/meal-plans',
    { signal }
  )

  return res.data.data
}

// GET /meal-plans/:planId
export async function getMealPlanById(planId: string, signal?: AbortSignal) {
  const res = await api.get<ApiResponse<StoredMealPlan>>(
    `/meal-plans/${planId}`,
    { signal }
  )

  return res.data.data
}

// DELETE /meal-plans/:planId
export async function deleteMealPlan(planId: string) {
  const res = await api.delete<ApiResponse<{ deleted: true }>>(
    `/meal-plans/${planId}`
  )

  return res.data.data
}

// POST /meal-plans/sessions/:sessionId/regenerate
export async function regenerateFullPlan(
  sessionId: string,
  reason: string,
  options?: GenerationOptions,
  signal?: AbortSignal
) {
  const res = await aiApi.post<ApiResponse<RegenerateFullPlanResponseData>>(
    `/meal-plans/sessions/${sessionId}/regenerate`,
    { reason, options },
    { signal }
  )

  return res.data.data
}

// POST /meal-plans/sessions/:sessionId/regenerate-meal
export async function regenerateSingleMeal(
  sessionId: string,
  mealId: string,
  reason: string,
  options?: GenerationOptions,
  signal?: AbortSignal
) {
  const res = await aiApi.post<ApiResponse<RegenerateSingleMealResponseData>>(
    `/meal-plans/sessions/${sessionId}/regenerate-meal`,
    { mealId, reason, options },
    { signal }
  )

  return res.data.data
}

// POST /meal-plans/sessions/:sessionId/confirm
export async function confirmSession(sessionId: string) {
  const res = await api.post<ApiResponse<ConfirmMealPlanResponseData>>(
    `/meal-plans/sessions/${sessionId}/confirm`
  )

  return res.data.data
}
