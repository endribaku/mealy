import { api } from '../lib/api'
import { ApiResponse, GenerationOptions } from './types'

export type MealPlan = {
  id: string
  days: any[]
}

export async function generateMealPlan(
  options?: GenerationOptions
) {
  const res = await api.post<ApiResponse<MealPlan>>(
    '/meal-plans',
    { options }
  )

  return res.data.data
}

export async function getMealPlans() {
  const res = await api.get<ApiResponse<MealPlan[]>>(
    '/meal-plans'
  )

  return res.data.data
}

export async function getMealPlanById(planId: string) {
  const res = await api.get<ApiResponse<MealPlan>>(
    `/meal-plans/${planId}`
  )

  return res.data.data
}

export async function deleteMealPlan(planId: string) {
  await api.delete(`/meal-plans/${planId}`)
}

export async function regenerateFullPlan(
  sessionId: string,
  reason: string,
  options?: GenerationOptions
) {
  const res = await api.post<ApiResponse<MealPlan>>(
    `/meal-plans/sessions/${sessionId}/regenerate`,
    {
      reason,
      options,
    }
  )

  return res.data.data
}

export async function regenerateSingleMeal(
  sessionId: string,
  mealId: string,
  reason: string,
  options?: GenerationOptions
) {
  const res = await api.post<ApiResponse<MealPlan>>(
    `/meal-plans/sessions/${sessionId}/regenerate-meal`,
    {
      mealId,
      reason,
      options,
    }
  )

  return res.data.data
}

export async function confirmSession(
  sessionId: string
) {
  const res = await api.post<ApiResponse<void>>(
    `/meal-plans/sessions/${sessionId}/confirm`
  )

  return res.data.success
}
