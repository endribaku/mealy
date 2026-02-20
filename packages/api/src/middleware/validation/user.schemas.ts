import { z } from 'zod'

// ============================================================
// CREATE USER
// ============================================================

export const CreateUserBodySchema = z.object({
	email: z.string().email(),
	profile: z.object({
		name: z.string().min(1),
		diet: z.string().optional(),
		calorieTarget: z.number().positive().optional(),
		cookingSkill: z.string().optional(),
		householdSize: z.number().positive().optional(),
		measurementSystem: z.enum(['metric', 'imperial']).optional(),
		goals: z.array(z.string()).optional(),
		preferences: z.any().optional()
	}).strict()
}).strict()

// ============================================================
// UPDATE PROFILE
// ============================================================

export const UpdateProfileBodySchema = z.object({
	name: z.string().min(1).optional(),
	diet: z.string().optional(),
	calorieTarget: z.number().positive().optional(),
	cookingSkill: z.string().optional(),
	householdSize: z.number().positive().optional(),
	measurementSystem: z.enum(['metric', 'imperial']).optional(),
	goals: z.array(z.string()).optional()
}).strict()

// ============================================================
// UPDATE LEARNED PREFERENCES
// ============================================================

export const UpdatePreferencesBodySchema = z.object({
	dislikedIngredients: z.array(z.string()).optional(),
	dislikedCuisines: z.array(z.string()).optional(),
	dislikedMealTypes: z.array(z.string()).optional(),
	favoriteCuisines: z.array(z.string()).optional(),
	favoriteIngredients: z.array(z.string()).optional(),
	favoriteMealTypes: z.array(z.string()).optional(),
	spiceLevel: z.enum(['none', 'mild', 'medium', 'spicy', 'extra-spicy']).optional(),
	preferredComplexity: z.enum(['very-simple', 'simple', 'moderate', 'complex', 'advanced']).optional()
}).strict()

// ============================================================
// UPDATE DIETARY RESTRICTIONS
// ============================================================

export const UpdateRestrictionsBodySchema = z.object({
	vegetarian: z.boolean().optional(),
	vegan: z.boolean().optional(),
	glutenFree: z.boolean().optional(),
	dairyFree: z.boolean().optional(),
	nutFree: z.boolean().optional()
}).strict()
