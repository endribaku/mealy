import { z } from 'zod'

// ============================================================================
// DOMAIN USER SCHEMA (ENGINE ONLY)
// This represents only what the meal-planning engine needs.
// No DB concerns. No timestamps. No account state.
// ============================================================================

// -----------------------------------------------------------------------------
// ENUMS
// -----------------------------------------------------------------------------

export const DietTypeEnum = z.enum([
  'omnivore',
  'vegetarian',
  'vegan',
  'pescatarian',
  'keto',
  'paleo',
  'gluten-free',
  'dairy-free',
  'low-carb',
  'mediterranean',
  'whole30'
])

export const CookingSkillEnum = z.enum([
  'beginner',
  'intermediate',
  'advanced',
  'expert'
])

export const SpiceLevelEnum = z.enum([
  'none',
  'mild',
  'medium',
  'spicy',
  'extra-spicy'
])

export const ComplexityEnum = z.enum([
  'very-simple',
  'simple',
  'moderate',
  'complex',
  'advanced'
])

export const MeasurementSystemEnum = z.enum([
  'metric',
  'imperial'
])

export const GoalEnum = z.enum([
  'maintain-weight',
  'lose-weight',
  'gain-weight',
  'build-muscle',
  'improve-health',
  'save-time',
  'save-money',
  'eat-healthier',
  'try-new-foods'
])

// -----------------------------------------------------------------------------
// USER PROFILE (PLANNING CONTEXT ONLY)
// -----------------------------------------------------------------------------

export const UserProfileSchema = z.object({
  name: z.string().min(1),

  diet: DietTypeEnum.optional(),
  calorieTarget: z.number().int().min(1000).max(5000).optional(),

  cookingSkill: CookingSkillEnum.optional(),
  householdSize: z.number().int().min(1).max(20).default(1),

  measurementSystem: MeasurementSystemEnum.default('imperial'),

  goals: z.array(GoalEnum).default([]),

  preferences: z.object({
    breakfastPreference: z.enum(['light', 'substantial', 'skip']).optional(),
    lunchPreference: z.enum(['light', 'substantial', 'packed']).optional(),
    dinnerPreference: z.enum(['light', 'substantial', 'family-style']).optional(),

    maxPrepTime: z.number().int().min(5).max(180).optional(),
    maxCookTime: z.number().int().min(5).max(300).optional(),

    budgetPerMeal: z.number().min(0).optional(),

    organicPreferred: z.boolean().optional(),
    localPreferred: z.boolean().optional(),
    seasonalPreferred: z.boolean().optional(),

    breakfastTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    lunchTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    dinnerTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  }).optional(),
})

// -----------------------------------------------------------------------------
// LEARNED PREFERENCES (AI PERSONALIZATION)
// -----------------------------------------------------------------------------

export const LearnedPreferencesSchema = z.object({
  dislikedIngredients: z.array(z.string()).default([]),
  dislikedCuisines: z.array(z.string()).default([]),
  dislikedMealTypes: z.array(z.string()).default([]),

  favoriteCuisines: z.array(z.string()).default([]),
  favoriteIngredients: z.array(z.string()).default([]),
  favoriteMealTypes: z.array(z.string()).default([]),

  spiceLevel: SpiceLevelEnum.optional(),
  preferredComplexity: ComplexityEnum.optional(),

  patterns: z.object({
    proteinPreferences: z.array(z.string()).optional(),
    cookingMethodPreferences: z.array(z.string()).optional(),
    prefersLeftovers: z.boolean().optional(),
    prefersBatchCooking: z.boolean().optional(),
    prefersMealPrep: z.boolean().optional(),
    cuisineFrequency: z.record(z.string(), z.number()).optional(),
  }).optional(),
})

// -----------------------------------------------------------------------------
// DIETARY RESTRICTIONS (SAFETY-CRITICAL)
// -----------------------------------------------------------------------------

export const DietaryRestrictionsSchema = z.object({
  allergies: z.array(z.object({
    name: z.string(),
    severity: z.enum(['mild', 'moderate', 'severe', 'life-threatening']),
    notes: z.string().optional(),
  })).default([]),

  intolerances: z.array(z.object({
    name: z.string(),
    symptoms: z.string().optional(),
  })).default([]),

  religiousRestrictions: z.array(z.string()).default([]),
  ethicalRestrictions: z.array(z.string()).default([]),

  medicalConditions: z.array(z.object({
    condition: z.string(),
    dietaryNotes: z.string().optional(),
  })).default([]),

  texturePreferences: z.object({
    avoid: z.array(z.string()).optional(),
    prefer: z.array(z.string()).optional(),
  }).optional(),
})

export const UserProfileUpdateSchema =
  UserProfileSchema.partial()

export const LearnedPreferencesUpdateSchema =
  LearnedPreferencesSchema.partial()

export const DietaryRestrictionsUpdateSchema =
  DietaryRestrictionsSchema.partial()


// -----------------------------------------------------------------------------
// FINAL DOMAIN USER
// -----------------------------------------------------------------------------

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),

  profile: UserProfileSchema,
  learnedPreferences: LearnedPreferencesSchema,
  dietaryRestrictions: DietaryRestrictionsSchema.optional(),
})

export type User = z.infer<typeof UserSchema>
export type UserProfileUpdate =
  z.infer<typeof UserProfileUpdateSchema>

export type LearnedPreferencesUpdate =
  z.infer<typeof LearnedPreferencesUpdateSchema>

export type DietaryRestrictionsUpdate =
  z.infer<typeof DietaryRestrictionsUpdateSchema>

export type LearnedPreferences =
  z.infer<typeof LearnedPreferencesSchema>

