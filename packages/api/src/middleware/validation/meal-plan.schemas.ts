import { z } from 'zod'

// ============================================================
// GENERATION OPTIONS
// ============================================================

export const GenerationOptionsSchema = z.object({
	provider: z.enum(['openai', 'anthropic']).optional(),
	temperature: z.number().min(0).max(1).optional(),
	maxTokens: z.number().positive().optional(),
}).strict()

// ============================================================
// GENERATE MEAL PLAN
// ============================================================

export const GenerateMealPlanBodySchema = z.object({
	options: GenerationOptionsSchema.optional()
}).strict()

// ============================================================
// REGENERATE SINGLE MEAL
// ============================================================

export const RegenerateSingleBodySchema = z.object({
	mealId: z.string().min(1),
	reason: z.string().min(1),
	options: GenerationOptionsSchema.optional()
}).strict()

// ============================================================
// REGENERATE FULL PLAN
// ============================================================

export const RegenerateFullBodySchema = z.object({
	reason: z.string().min(1),
	options: GenerationOptionsSchema.optional()
}).strict()
