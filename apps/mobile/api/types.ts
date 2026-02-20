/* ============================================================
   GENERIC API RESPONSE WRAPPERS
============================================================ */

export type ApiResponse<T> = {
  success: true
  data: T
}

export type ApiErrorResponse = {
  success: false
  message: string
  errors?: { message: string; path: (string | number)[] }[]
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly validationErrors?: ApiErrorResponse['errors']
  ) {
    super(message)
    this.name = 'ApiError'
  }

  get isNotFound() { return this.status === 404 }
  get isUnauthorized() { return this.status === 401 }
  get isForbidden() { return this.status === 403 }
  get isValidation() { return this.status === 400 }
  get isRateLimited() { return this.status === 429 }
  get isServer() { return this.status >= 500 }
}

/* ============================================================
   GENERATION OPTIONS
============================================================ */

export type GenerationOptions = {
  provider?: 'openai' | 'anthropic'
  temperature?: number
  maxTokens?: number
  specialInstructions?: string
}

/* ============================================================
   MEAL PLAN DOMAIN TYPES
============================================================ */

export type Nutrition = {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
}

export type Meal = {
  name: string
  cuisine: string
  ingredients: string[]
  nutrition: Nutrition
  instructions: string[]
  prepTime: number
  spiceLevel: number
  complexity: number
}

export type Day = {
  dayNumber: number
  meals: {
    breakfast: Meal
    lunch: Meal
    dinner: Meal
  }
}

export type NutritionSummary = {
  avgDailyCalories: number
  avgProtein: number
}

export type MealPlan = {
  days: Day[]
  nutritionSummary: NutritionSummary
}

export type StoredMealPlan = {
  id: string
  userId: string
  mealPlan: MealPlan
  createdAt: string
  status: 'active' | 'archived' | 'deleted'
}

/* ============================================================
   SESSION TYPES
============================================================ */

export type SessionModification = {
  action: string
  mealId?: string
  reason: string
}

export type SessionStatus = 'active' | 'confirmed' | 'expired' | 'cancelled'

export type Session = {
  id: string
  userId: string
  createdAt: string
  updatedAt: string
  expiresAt: string
  currentMealPlan?: MealPlan
  modifications: SessionModification[]
  temporaryConstraints: string[]
  status: SessionStatus
}

/* ============================================================
   USER TYPES
============================================================ */

export type UserProfile = {
  name: string
  diet: string
  calorieTarget: number
  cookingSkill: string
  householdSize: number
  measurementSystem: 'metric' | 'imperial'
  goals: string[]
  preferences?: {
    breakfastPreference?: 'light' | 'substantial' | 'skip'
    lunchPreference?: 'light' | 'substantial' | 'packed'
    dinnerPreference?: 'light' | 'substantial' | 'family-style'
    maxPrepTime?: number
    maxCookTime?: number
    budgetPerMeal?: number
    organicPreferred?: boolean
    localPreferred?: boolean
    seasonalPreferred?: boolean
    breakfastTime?: string
    lunchTime?: string
    dinnerTime?: string
  }
}

export type LearnedPreferences = {
  dislikedIngredients: string[]
  dislikedCuisines: string[]
  dislikedMealTypes: string[]
  favoriteCuisines: string[]
  favoriteIngredients: string[]
  favoriteMealTypes: string[]
  spiceLevel?: number
  preferredComplexity?: number
  patterns?: {
    proteinPreferences?: string[]
    cookingMethodPreferences?: string[]
    prefersLeftovers?: boolean
    prefersBatchCooking?: boolean
    prefersMealPrep?: boolean
    cuisineFrequency?: Record<string, number>
  }
}

export type DietaryRestrictions = {
  allergies: { name: string; severity: string; notes?: string }[]
  intolerances: { name: string; symptoms?: string }[]
  religiousRestrictions: string[]
  ethicalRestrictions: string[]
  medicalConditions: { condition: string; dietaryNotes?: string }[]
  texturePreferences?: {
    avoid?: string[]
    prefer?: string[]
  }
}

export type User = {
  id: string
  email: string
  profile: UserProfile
  learnedPreferences: LearnedPreferences
  dietaryRestrictions?: DietaryRestrictions
}

/* ============================================================
   MEAL PLAN API REQUEST / RESPONSE TYPES
============================================================ */

// POST /meal-plans
export type GenerateMealPlanRequest = {
  options?: GenerationOptions
}

export type GenerateMealPlanResponseData = {
  session: Session
  metadata: {
    tokensUsed: number
    generationTime: number
  }
}

// POST /meal-plans/sessions/:sessionId/regenerate-meal
export type RegenerateSingleMealRequest = {
  mealId: string
  reason: string
  options?: GenerationOptions
}

export type RegenerateSingleMealResponseData = {
  session: Session
}

// POST /meal-plans/sessions/:sessionId/regenerate
export type RegenerateFullPlanRequest = {
  reason: string
  options?: GenerationOptions
}

export type RegenerateFullPlanResponseData = {
  session: Session
}

// POST /meal-plans/sessions/:sessionId/confirm
export type ConfirmMealPlanResponseData = {
  session: Session
}

/* ============================================================
   USER API REQUEST / RESPONSE TYPES
============================================================ */

// POST /users
export type CreateUserRequest = {
  email: string
  profile: {
    name: string
    diet?: string
    calorieTarget?: number
    cookingSkill?: string
    householdSize?: number
    measurementSystem?: 'metric' | 'imperial'
    goals?: string[]
    preferences?: Record<string, unknown>
  }
}

// PATCH /users/me/profile
export type UpdateProfileRequest = {
  name?: string
  diet?: string
  calorieTarget?: number
  cookingSkill?: string
  householdSize?: number
  measurementSystem?: 'metric' | 'imperial'
  goals?: string[]
}

// PATCH /users/me/preferences
export type UpdatePreferencesRequest = {
  dislikedIngredients?: string[]
  dislikedCuisines?: string[]
  dislikedMealTypes?: string[]
  favoriteCuisines?: string[]
  favoriteIngredients?: string[]
  favoriteMealTypes?: string[]
  spiceLevel?: string
  preferredComplexity?: string
}

// PATCH /users/me/restrictions
export type UpdateRestrictionsRequest = {
  vegetarian?: boolean
  vegan?: boolean
  glutenFree?: boolean
  dairyFree?: boolean
  nutFree?: boolean
}
