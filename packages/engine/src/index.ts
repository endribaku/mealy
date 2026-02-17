// ============================================================
// MEAL PLAN GENERATION
// ============================================================

export {
  MealPlanGenerator,
  AIProvider
} from './core/meal-plan/meal-plan-generator.js'

export type {
  GenerationOptions,
  GenerationResult
} from './core/meal-plan/meal-plan-generator.js'


// ============================================================
// CONTEXT BUILDING
// ============================================================

export {
  ContextBuilder
} from './core/context-builder.js'

export type {
  FullContext,
  SessionContext
} from './core/context-builder.js'


// ============================================================
// PROMPT CONFIGURATION
// ============================================================

export {
  DEFAULT_PROMPT_CONFIG
} from './core/meal-plan/prompt-builder.js'

export type {
  PromptConfig
} from './core/meal-plan/prompt-builder.js'


// ============================================================
// DOMAIN TYPES
// ============================================================


// interfaces

export type { IDataAccess } from './core/data-access.js'
export type { IContextBuilder } from './core/interfaces/context-builder.interface.js'
export type { IMealPlanGenerator } from './core/interfaces/meal-plan-generator.interface.js'


// types
export type {
  User,
  UserProfileUpdate,
  LearnedPreferencesUpdate,
  DietaryRestrictionsUpdate
} from './core/schemas/user-schemas.js'

export type {
  Session,
  MealPlan,
  StoredMealPlan
} from './core/schemas/schemas.js'

export {
  UserSchema
} from './core/schemas/user-schemas.js'

export {
  SessionSchema
} from './core/schemas/schemas.js'
