import { computeLearnedPreferences, LearningInput } from '../src/core/learning/preference-learner'
import { StoredMealPlan, Session, Meal, MealPlan } from '../src/core/schemas/schemas'

/* ========================================================================== */
/*                              TEST FACTORIES                                */
/* ========================================================================== */

function makeMeal(overrides: Partial<Meal> = {}): Meal {
  return {
    name: 'Test Meal',
    cuisine: 'Italian',
    ingredients: [
      { name: 'Chicken', amount: 200, unit: 'g' },
      { name: 'Olive Oil', amount: 2, unit: 'tbsp' },
      { name: 'Salt', amount: 1, unit: 'tsp' },
    ],
    nutrition: { calories: 500, protein: 30, carbs: 40, fat: 20 },
    instructions: ['Step 1'],
    prepTime: 15,
    spiceLevel: 'none',
    complexity: 'simple',
    ...overrides,
  }
}

function makeMealPlan(meals: Meal[], daysCount = 1): MealPlan {
  const days = []
  let mealIndex = 0
  for (let d = 0; d < daysCount; d++) {
    days.push({
      dayNumber: d + 1,
      meals: {
        breakfast: meals[mealIndex % meals.length],
        lunch: meals[(mealIndex + 1) % meals.length],
        dinner: meals[(mealIndex + 2) % meals.length],
      },
    })
    mealIndex += 3
  }
  return {
    days,
    nutritionSummary: { avgDailyCalories: 2000, avgProtein: 100 },
  }
}

function makeStoredPlan(mealPlan: MealPlan, id = 'plan-1'): StoredMealPlan {
  return {
    id,
    userId: 'user-1',
    mealPlan,
    createdAt: '2026-01-01T00:00:00Z',
    status: 'active',
  }
}

function makeSession(
  modifications: Session['modifications'] = [],
  id = 'session-1'
): Session {
  return {
    id,
    userId: 'user-1',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    expiresAt: '2026-01-02T00:00:00Z',
    currentMealPlan: undefined,
    modifications,
    temporaryConstraints: [],
    status: 'confirmed',
  }
}

/* ========================================================================== */
/*                               TEST SUITE                                   */
/* ========================================================================== */

describe('computeLearnedPreferences', () => {
  // ================================================================
  // ACTIVATION THRESHOLD
  // ================================================================

  describe('activation threshold', () => {
    it('returns shouldUpdate: false with fewer than 3 plans and fewer than 21 meals', () => {
      const meal = makeMeal()
      const plan = makeStoredPlan(makeMealPlan([meal], 2)) // 2 days = 6 meals

      const result = computeLearnedPreferences({
        confirmedPlans: [plan, plan], // 2 plans, 12 meals
        confirmedSessions: [],
      })

      expect(result.shouldUpdate).toBe(false)
      expect(result.preferences).toBeNull()
    })

    it('activates with >= 3 plans', () => {
      const meal = makeMeal()
      const plan = makeStoredPlan(makeMealPlan([meal], 1)) // 1 day = 3 meals

      const result = computeLearnedPreferences({
        confirmedPlans: [plan, plan, plan], // 3 plans, 9 meals
        confirmedSessions: [],
      })

      expect(result.shouldUpdate).toBe(true)
      expect(result.preferences).not.toBeNull()
    })

    it('activates with < 3 plans but >= 21 meals', () => {
      const meal = makeMeal()
      const plan = makeStoredPlan(makeMealPlan([meal], 7)) // 7 days = 21 meals

      const result = computeLearnedPreferences({
        confirmedPlans: [plan], // 1 plan, 21 meals
        confirmedSessions: [],
      })

      expect(result.shouldUpdate).toBe(true)
      expect(result.preferences).not.toBeNull()
    })
  })

  // ================================================================
  // FAVORITE CUISINES
  // ================================================================

  describe('favorite cuisines (>= 40% threshold)', () => {
    it('marks cuisine as favorite when >= 40% of meals', () => {
      // 3 plans, each with 1 day = 9 meals total
      // All 9 meals are Italian = 100%
      const italianMeal = makeMeal({ cuisine: 'Italian' })
      const plan = makeStoredPlan(makeMealPlan([italianMeal], 1))

      const result = computeLearnedPreferences({
        confirmedPlans: [plan, plan, plan],
        confirmedSessions: [],
      })

      expect(result.preferences!.favoriteCuisines).toContain('italian')
    })

    it('does not mark cuisine as favorite when < 40%', () => {
      // 3 plans, 9 meals total
      // 3 Italian, 3 Mexican, 3 Japanese = 33% each
      const italian = makeMeal({ cuisine: 'Italian' })
      const mexican = makeMeal({ cuisine: 'Mexican' })
      const japanese = makeMeal({ cuisine: 'Japanese' })

      const plan1 = makeStoredPlan(makeMealPlan([italian], 1), 'p1')
      const plan2 = makeStoredPlan(makeMealPlan([mexican], 1), 'p2')
      const plan3 = makeStoredPlan(makeMealPlan([japanese], 1), 'p3')

      const result = computeLearnedPreferences({
        confirmedPlans: [plan1, plan2, plan3],
        confirmedSessions: [],
      })

      expect(result.preferences!.favoriteCuisines).toHaveLength(0)
    })

    it('normalizes cuisine names to lowercase', () => {
      const meal = makeMeal({ cuisine: 'ITALIAN' })
      const plan = makeStoredPlan(makeMealPlan([meal], 1))

      const result = computeLearnedPreferences({
        confirmedPlans: [plan, plan, plan],
        confirmedSessions: [],
      })

      expect(result.preferences!.favoriteCuisines).toContain('italian')
      expect(result.preferences!.favoriteCuisines).not.toContain('ITALIAN')
    })
  })

  // ================================================================
  // FAVORITE INGREDIENTS
  // ================================================================

  describe('favorite ingredients (>= 35% threshold, excludes fillers)', () => {
    it('marks ingredient as favorite when >= 35% of meals', () => {
      // All meals contain chicken
      const meal = makeMeal({
        ingredients: [
          { name: 'Chicken', amount: 200, unit: 'g' },
          { name: 'Salt', amount: 1, unit: 'tsp' },
        ],
      })
      const plan = makeStoredPlan(makeMealPlan([meal], 1))

      const result = computeLearnedPreferences({
        confirmedPlans: [plan, plan, plan],
        confirmedSessions: [],
      })

      expect(result.preferences!.favoriteIngredients).toContain('chicken')
    })

    it('excludes filler ingredients even at 100%', () => {
      const meal = makeMeal({
        ingredients: [
          { name: 'Salt', amount: 1, unit: 'tsp' },
          { name: 'Olive Oil', amount: 2, unit: 'tbsp' },
          { name: 'Pepper', amount: 1, unit: 'tsp' },
          { name: 'Water', amount: 1, unit: 'cup' },
          { name: 'Butter', amount: 1, unit: 'tbsp' },
          { name: 'Sugar', amount: 1, unit: 'tsp' },
          { name: 'Flour', amount: 1, unit: 'cup' },
        ],
      })
      const plan = makeStoredPlan(makeMealPlan([meal], 1))

      const result = computeLearnedPreferences({
        confirmedPlans: [plan, plan, plan],
        confirmedSessions: [],
      })

      expect(result.preferences!.favoriteIngredients).toHaveLength(0)
    })

    it('deduplicates ingredients within a single meal', () => {
      // Same ingredient listed twice in one meal should only count once
      const meal = makeMeal({
        ingredients: [
          { name: 'Chicken', amount: 200, unit: 'g' },
          { name: 'Chicken', amount: 100, unit: 'g' },
        ],
      })
      const plan = makeStoredPlan(makeMealPlan([meal], 1))

      const result = computeLearnedPreferences({
        confirmedPlans: [plan, plan, plan], // 9 meals, chicken in all
        confirmedSessions: [],
      })

      // Should still appear since it's in every meal
      expect(result.preferences!.favoriteIngredients).toContain('chicken')
    })
  })

  // ================================================================
  // DISLIKED INGREDIENTS (from rejections)
  // ================================================================

  describe('disliked ingredients (>= 2 rejections)', () => {
    it('marks ingredient as disliked after >= 2 rejections', () => {
      const rejectedMeal = makeMeal({
        ingredients: [{ name: 'Tofu', amount: 200, unit: 'g' }],
      })

      const session = makeSession([
        {
          timestamp: '2026-01-01T00:00:00Z',
          action: 'regenerate-meal',
          mealId: 'day-1-lunch',
          reason: 'dislike',
          rejectedMeal,
        },
        {
          timestamp: '2026-01-02T00:00:00Z',
          action: 'regenerate-meal',
          mealId: 'day-2-lunch',
          reason: 'dislike',
          rejectedMeal,
        },
      ])

      const meal = makeMeal()
      const plan = makeStoredPlan(makeMealPlan([meal], 1))

      const result = computeLearnedPreferences({
        confirmedPlans: [plan, plan, plan],
        confirmedSessions: [session],
      })

      expect(result.preferences!.dislikedIngredients).toContain('tofu')
    })

    it('does not mark ingredient as disliked with only 1 rejection', () => {
      const rejectedMeal = makeMeal({
        ingredients: [{ name: 'Tofu', amount: 200, unit: 'g' }],
      })

      const session = makeSession([
        {
          timestamp: '2026-01-01T00:00:00Z',
          action: 'regenerate-meal',
          mealId: 'day-1-lunch',
          reason: 'dislike',
          rejectedMeal,
        },
      ])

      const meal = makeMeal()
      const plan = makeStoredPlan(makeMealPlan([meal], 1))

      const result = computeLearnedPreferences({
        confirmedPlans: [plan, plan, plan],
        confirmedSessions: [session],
      })

      expect(result.preferences!.dislikedIngredients).not.toContain('tofu')
    })

    it('excludes filler ingredients from dislikes', () => {
      const rejectedMeal = makeMeal({
        ingredients: [{ name: 'Olive Oil', amount: 2, unit: 'tbsp' }],
      })

      const session = makeSession([
        {
          timestamp: '2026-01-01T00:00:00Z',
          action: 'regenerate-meal',
          mealId: 'day-1-lunch',
          reason: 'too oily',
          rejectedMeal,
        },
        {
          timestamp: '2026-01-02T00:00:00Z',
          action: 'regenerate-meal',
          mealId: 'day-2-lunch',
          reason: 'too oily',
          rejectedMeal,
        },
      ])

      const meal = makeMeal()
      const plan = makeStoredPlan(makeMealPlan([meal], 1))

      const result = computeLearnedPreferences({
        confirmedPlans: [plan, plan, plan],
        confirmedSessions: [session],
      })

      expect(result.preferences!.dislikedIngredients).not.toContain('olive oil')
    })

    it('ignores regenerate-all modifications for dislikes', () => {
      const rejectedMeal = makeMeal({
        cuisine: 'Thai',
        ingredients: [{ name: 'Tofu', amount: 200, unit: 'g' }],
      })

      const session = makeSession([
        {
          timestamp: '2026-01-01T00:00:00Z',
          action: 'regenerate-all',
          reason: 'want different plan',
          rejectedMeal, // should be ignored since action is regenerate-all
        },
        {
          timestamp: '2026-01-02T00:00:00Z',
          action: 'regenerate-all',
          reason: 'still not happy',
          rejectedMeal,
        },
      ])

      const meal = makeMeal()
      const plan = makeStoredPlan(makeMealPlan([meal], 1))

      const result = computeLearnedPreferences({
        confirmedPlans: [plan, plan, plan],
        confirmedSessions: [session],
      })

      expect(result.preferences!.dislikedIngredients).not.toContain('tofu')
      expect(result.preferences!.dislikedCuisines).not.toContain('thai')
    })
  })

  // ================================================================
  // DISLIKED CUISINES (from rejections)
  // ================================================================

  describe('disliked cuisines (>= 2 rejections)', () => {
    it('marks cuisine as disliked after >= 2 rejections', () => {
      const rejectedMeal = makeMeal({ cuisine: 'Thai' })

      const session = makeSession([
        {
          timestamp: '2026-01-01T00:00:00Z',
          action: 'regenerate-meal',
          mealId: 'day-1-lunch',
          reason: 'too spicy',
          rejectedMeal,
        },
        {
          timestamp: '2026-01-02T00:00:00Z',
          action: 'regenerate-meal',
          mealId: 'day-2-dinner',
          reason: 'too spicy again',
          rejectedMeal,
        },
      ])

      const meal = makeMeal()
      const plan = makeStoredPlan(makeMealPlan([meal], 1))

      const result = computeLearnedPreferences({
        confirmedPlans: [plan, plan, plan],
        confirmedSessions: [session],
      })

      expect(result.preferences!.dislikedCuisines).toContain('thai')
    })
  })

  // ================================================================
  // PREFERRED COMPLEXITY
  // ================================================================

  describe('preferred complexity (unique plurality winner)', () => {
    it('sets complexity when there is a clear winner', () => {
      // All meals are 'simple'
      const meal = makeMeal({ complexity: 'simple' })
      const plan = makeStoredPlan(makeMealPlan([meal], 1))

      const result = computeLearnedPreferences({
        confirmedPlans: [plan, plan, plan],
        confirmedSessions: [],
      })

      expect(result.preferences!.preferredComplexity).toBe('simple')
    })

    it('returns undefined on exact tie', () => {
      // 3 plans × 1 day = 9 meals
      // We need an exact tie. Use 3 different complexities, 3 meals each
      const simple = makeMeal({ complexity: 'simple' })
      const moderate = makeMeal({ complexity: 'moderate' })
      const complex = makeMeal({ complexity: 'complex' })

      // Each plan has 1 day with 3 different complexities
      const plan1 = makeStoredPlan(
        {
          days: [{
            dayNumber: 1,
            meals: {
              breakfast: simple,
              lunch: moderate,
              dinner: complex,
            },
          }],
          nutritionSummary: { avgDailyCalories: 2000, avgProtein: 100 },
        },
        'p1'
      )
      const plan2 = makeStoredPlan(
        {
          days: [{
            dayNumber: 1,
            meals: {
              breakfast: simple,
              lunch: moderate,
              dinner: complex,
            },
          }],
          nutritionSummary: { avgDailyCalories: 2000, avgProtein: 100 },
        },
        'p2'
      )
      const plan3 = makeStoredPlan(
        {
          days: [{
            dayNumber: 1,
            meals: {
              breakfast: simple,
              lunch: moderate,
              dinner: complex,
            },
          }],
          nutritionSummary: { avgDailyCalories: 2000, avgProtein: 100 },
        },
        'p3'
      )

      const result = computeLearnedPreferences({
        confirmedPlans: [plan1, plan2, plan3],
        confirmedSessions: [],
      })

      expect(result.preferences!.preferredComplexity).toBeUndefined()
    })
  })

  // ================================================================
  // SPICE LEVEL
  // ================================================================

  describe('spice level (> 50% majority)', () => {
    it('sets spice level when > 50% of meals share it', () => {
      // All meals are 'none' = 100%
      const meal = makeMeal({ spiceLevel: 'none' })
      const plan = makeStoredPlan(makeMealPlan([meal], 1))

      const result = computeLearnedPreferences({
        confirmedPlans: [plan, plan, plan],
        confirmedSessions: [],
      })

      expect(result.preferences!.spiceLevel).toBe('none')
    })

    it('returns undefined when no spice level > 50%', () => {
      // 3 plans × 1 day = 9 meals
      // 3 none, 3 mild, 3 spicy = 33% each
      const none = makeMeal({ spiceLevel: 'none' })
      const mild = makeMeal({ spiceLevel: 'mild' })
      const spicy = makeMeal({ spiceLevel: 'spicy' })

      const plan1 = makeStoredPlan(
        {
          days: [{
            dayNumber: 1,
            meals: { breakfast: none, lunch: mild, dinner: spicy },
          }],
          nutritionSummary: { avgDailyCalories: 2000, avgProtein: 100 },
        },
        'p1'
      )
      const plan2 = makeStoredPlan(
        {
          days: [{
            dayNumber: 1,
            meals: { breakfast: none, lunch: mild, dinner: spicy },
          }],
          nutritionSummary: { avgDailyCalories: 2000, avgProtein: 100 },
        },
        'p2'
      )
      const plan3 = makeStoredPlan(
        {
          days: [{
            dayNumber: 1,
            meals: { breakfast: none, lunch: mild, dinner: spicy },
          }],
          nutritionSummary: { avgDailyCalories: 2000, avgProtein: 100 },
        },
        'p3'
      )

      const result = computeLearnedPreferences({
        confirmedPlans: [plan1, plan2, plan3],
        confirmedSessions: [],
      })

      expect(result.preferences!.spiceLevel).toBeUndefined()
    })

    it('returns undefined at exactly 50%', () => {
      // Need exactly 50%. 4 plans × 1 day = 12 meals. 6 none, 6 mild
      const none = makeMeal({ spiceLevel: 'none' })
      const mild = makeMeal({ spiceLevel: 'mild' })

      const planNone = makeStoredPlan(makeMealPlan([none], 1), 'pn1')
      const planNone2 = makeStoredPlan(makeMealPlan([none], 1), 'pn2')
      const planMild = makeStoredPlan(makeMealPlan([mild], 1), 'pm1')
      const planMild2 = makeStoredPlan(makeMealPlan([mild], 1), 'pm2')

      const result = computeLearnedPreferences({
        confirmedPlans: [planNone, planNone2, planMild, planMild2],
        confirmedSessions: [],
      })

      // 6/12 = 50%, which is <= 50%, so undefined
      expect(result.preferences!.spiceLevel).toBeUndefined()
    })
  })

  // ================================================================
  // UNUSED FIELDS
  // ================================================================

  describe('out-of-scope fields', () => {
    it('sets dislikedMealTypes and favoriteMealTypes to empty arrays', () => {
      const meal = makeMeal()
      const plan = makeStoredPlan(makeMealPlan([meal], 1))

      const result = computeLearnedPreferences({
        confirmedPlans: [plan, plan, plan],
        confirmedSessions: [],
      })

      expect(result.preferences!.dislikedMealTypes).toEqual([])
      expect(result.preferences!.favoriteMealTypes).toEqual([])
    })
  })
})
