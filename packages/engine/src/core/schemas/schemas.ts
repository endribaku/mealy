import { z } from 'zod'

// ============================================================================
// MEAL PLAN SCHEMAS
// ============================================================================

export const SpiceLevelEnum = z.enum(['none', 'mild', 'medium', 'spicy'])
export const ComplexityEnum = z.enum(['very-simple', 'simple', 'moderate', 'complex'])

export const IngredientSchema = z.object({
  name: z.string(),
  amount: z.number(),
  unit: z.string(),
})

export const NutritionSchema = z.object({
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
})

export const MealSchema = z.object({
  name: z.string(),
  cuisine: z.string(),
  ingredients: z.array(IngredientSchema),
  nutrition: NutritionSchema,
  instructions: z.array(z.string()),
  prepTime: z.number(),
  spiceLevel: SpiceLevelEnum,
  complexity: ComplexityEnum,
})

export const DaySchema = z.object({
  dayNumber: z.number(),
  meals: z.object({
    breakfast: MealSchema,
    lunch: MealSchema,
    dinner: MealSchema,
  }),
})

export const NutritionSummarySchema = z.object({
  avgDailyCalories: z.number(),
  avgProtein: z.number(),
})

export const MealPlanSchema = z.object({
  days: z.array(DaySchema),
  nutritionSummary: NutritionSummarySchema,
})

// ============================================================================
// SESSION SCHEMAS
// ============================================================================

export const SessionModificationSchema = z.object({
  timestamp: z.string(),
  action: z.enum(['regenerate-meal', 'regenerate-all']),
  mealId: z.string().optional(),
  reason: z.string(),
})

export const SessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  expiresAt: z.string(),
  
  currentMealPlan: MealPlanSchema.optional(),
  modifications: z.array(SessionModificationSchema).default([]),
  temporaryConstraints: z.array(z.string()).default([]),
  
  status: z.enum(['active', 'confirmed', 'expired', 'cancelled']).default('active'),
})

export interface StoredMealPlan {
  id: string
  userId: string
  mealPlan: MealPlan
  createdAt: string
  status: 'active' | 'archived' | 'deleted'
  startDate?: string
  endDate?: string
}



// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Ingredient = z.infer<typeof IngredientSchema>
export type Nutrition = z.infer<typeof NutritionSchema>
export type Meal = z.infer<typeof MealSchema>
export type Day = z.infer<typeof DaySchema>
export type NutritionSummary = z.infer<typeof NutritionSummarySchema>
export type MealPlan = z.infer<typeof MealPlanSchema>
export type SessionModification = z.infer<typeof SessionModificationSchema>
export type Session = z.infer<typeof SessionSchema>
