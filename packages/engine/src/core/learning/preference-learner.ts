import type { StoredMealPlan, Session, Meal } from '../schemas/schemas.js'
import type { LearnedPreferences } from '../schemas/user-schemas.js'

// Ingredients excluded from favorite/disliked analysis — universal cooking basics
const FILLER_INGREDIENTS = new Set([
  'salt', 'pepper', 'black pepper', 'white pepper',
  'water', 'oil', 'olive oil', 'vegetable oil', 'canola oil', 'sesame oil',
  'butter', 'sugar', 'brown sugar',
  'flour', 'all-purpose flour',
  'baking powder', 'baking soda',
  'cooking spray',
])

export interface LearningInput {
  confirmedPlans: StoredMealPlan[]
  confirmedSessions: Session[]
}

export interface LearningResult {
  shouldUpdate: boolean
  preferences: LearnedPreferences | null
}

export function computeLearnedPreferences(input: LearningInput): LearningResult {
  const { confirmedPlans, confirmedSessions } = input

  // Flatten all meals from confirmed plans
  const allMeals: Meal[] = confirmedPlans.flatMap(plan =>
    plan.mealPlan.days.flatMap(day => [
      day.meals.breakfast,
      day.meals.lunch,
      day.meals.dinner,
    ])
  )

  const totalMeals = allMeals.length
  const totalPlans = confirmedPlans.length

  // Activation threshold: >=3 plans OR >=21 meals
  if (totalPlans < 3 && totalMeals < 21) {
    return { shouldUpdate: false, preferences: null }
  }

  // ================================================================
  // FAVORITE CUISINES (>=40% of all meals)
  // ================================================================
  const cuisineCounts = new Map<string, number>()
  for (const meal of allMeals) {
    const c = meal.cuisine.toLowerCase().trim()
    cuisineCounts.set(c, (cuisineCounts.get(c) ?? 0) + 1)
  }

  const favoriteCuisines = [...cuisineCounts.entries()]
    .filter(([, count]) => count / totalMeals >= 0.40)
    .map(([cuisine]) => cuisine)

  // ================================================================
  // FAVORITE INGREDIENTS (>=35% of meals, excluding fillers)
  // ================================================================
  const ingredientCounts = new Map<string, number>()
  for (const meal of allMeals) {
    const seen = new Set<string>()
    for (const ing of meal.ingredients) {
      const normalized = ing.name.toLowerCase().trim()
      if (!FILLER_INGREDIENTS.has(normalized) && !seen.has(normalized)) {
        seen.add(normalized)
        ingredientCounts.set(normalized, (ingredientCounts.get(normalized) ?? 0) + 1)
      }
    }
  }

  const favoriteIngredients = [...ingredientCounts.entries()]
    .filter(([, count]) => count / totalMeals >= 0.35)
    .map(([ingredient]) => ingredient)

  // ================================================================
  // DISLIKED INGREDIENTS & CUISINES (from rejection history)
  // Ingredient/cuisine in a rejected meal appearing >=2 times
  // ================================================================
  const rejectedIngredientCounts = new Map<string, number>()
  const rejectedCuisineCounts = new Map<string, number>()

  for (const session of confirmedSessions) {
    for (const mod of session.modifications) {
      if (mod.action === 'regenerate-meal' && mod.rejectedMeal) {
        // Count cuisine
        const c = mod.rejectedMeal.cuisine.toLowerCase().trim()
        rejectedCuisineCounts.set(c, (rejectedCuisineCounts.get(c) ?? 0) + 1)

        // Count ingredients (deduplicated per rejection)
        const seen = new Set<string>()
        for (const ing of mod.rejectedMeal.ingredients) {
          const normalized = ing.name.toLowerCase().trim()
          if (!FILLER_INGREDIENTS.has(normalized) && !seen.has(normalized)) {
            seen.add(normalized)
            rejectedIngredientCounts.set(normalized, (rejectedIngredientCounts.get(normalized) ?? 0) + 1)
          }
        }
      }
    }
  }

  const dislikedIngredients = [...rejectedIngredientCounts.entries()]
    .filter(([, count]) => count >= 2)
    .map(([ingredient]) => ingredient)

  const dislikedCuisines = [...rejectedCuisineCounts.entries()]
    .filter(([, count]) => count >= 2)
    .map(([cuisine]) => cuisine)

  // ================================================================
  // PREFERRED COMPLEXITY (unique plurality winner, undefined on tie)
  // ================================================================
  const complexityCounts = new Map<string, number>()
  for (const meal of allMeals) {
    complexityCounts.set(meal.complexity, (complexityCounts.get(meal.complexity) ?? 0) + 1)
  }

  const preferredComplexity = getPlurality(complexityCounts) as LearnedPreferences['preferredComplexity']

  // ================================================================
  // SPICE LEVEL (most frequent if >50%, otherwise undefined)
  // ================================================================
  const spiceCounts = new Map<string, number>()
  for (const meal of allMeals) {
    spiceCounts.set(meal.spiceLevel, (spiceCounts.get(meal.spiceLevel) ?? 0) + 1)
  }

  const spiceLevel = getMajority(spiceCounts, totalMeals) as LearnedPreferences['spiceLevel']

  const preferences: LearnedPreferences = {
    dislikedIngredients,
    dislikedCuisines,
    dislikedMealTypes: [],
    favoriteCuisines,
    favoriteIngredients,
    favoriteMealTypes: [],
    spiceLevel,
    preferredComplexity,
  }

  return { shouldUpdate: true, preferences }
}

/**
 * Returns the key with strictly >50% of total, or undefined.
 */
function getMajority(counts: Map<string, number>, total: number): string | undefined {
  let maxKey: string | undefined
  let maxCount = 0

  for (const [key, count] of counts) {
    if (count > maxCount) {
      maxKey = key
      maxCount = count
    }
  }

  if (!maxKey || maxCount / total <= 0.50) return undefined
  return maxKey
}

/**
 * Returns the unique winner (highest count). Undefined if tied.
 */
function getPlurality(counts: Map<string, number>): string | undefined {
  let maxKey: string | undefined
  let maxCount = 0
  let tied = false

  for (const [key, count] of counts) {
    if (count > maxCount) {
      maxKey = key
      maxCount = count
      tied = false
    } else if (count === maxCount && count > 0) {
      tied = true
    }
  }

  if (!maxKey || tied) return undefined
  return maxKey
}
