import type { StoredMealPlan, Day } from '../api/types'

/**
 * Maps a calendar date to a meal plan's dayNumber.
 * Returns null if the date falls outside the plan's range.
 */
export function getDayNumberForDate(
  dateStr: string,
  planStartDate: string,
  totalDays: number
): number | null {
  const date = new Date(dateStr + 'T00:00:00')
  const start = new Date(planStartDate + 'T00:00:00')

  const diffMs = date.getTime() - start.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
  const dayNumber = diffDays + 1

  if (dayNumber < 1 || dayNumber > totalDays) {
    return null
  }

  return dayNumber
}

/**
 * Returns the Day object (with meals) for a given date from a stored meal plan.
 */
export function getMealsForDate(
  plan: StoredMealPlan,
  dateStr: string
): Day | null {
  if (!plan.startDate) return null

  const dayNumber = getDayNumberForDate(
    dateStr,
    plan.startDate,
    plan.mealPlan.days.length
  )

  if (dayNumber === null) return null

  return plan.mealPlan.days.find(d => d.dayNumber === dayNumber) ?? null
}

/**
 * Builds a map of date strings to plan IDs for marking calendar days.
 */
export function buildMarkedDates(
  plans: StoredMealPlan[]
): Record<string, { planId: string }> {
  const marked: Record<string, { planId: string }> = {}

  for (const plan of plans) {
    if (!plan.startDate || !plan.endDate) continue

    const current = new Date(plan.startDate + 'T00:00:00')
    const end = new Date(plan.endDate + 'T00:00:00')

    while (current <= end) {
      const key = current.toISOString().split('T')[0]
      marked[key] = { planId: plan.id }
      current.setDate(current.getDate() + 1)
    }
  }

  return marked
}

/**
 * Returns the last day of a month given "YYYY-MM" format.
 */
export function getLastDayOfMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number)
  const lastDay = new Date(year, month, 0).getDate()
  return `${yearMonth}-${String(lastDay).padStart(2, '0')}`
}

/**
 * Returns today's date as "YYYY-MM-DD".
 */
export function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Returns the current month as "YYYY-MM".
 */
export function getCurrentMonth(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}
