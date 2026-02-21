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

// ============================================================
// CONFIRM PLAN
// ============================================================

export const ConfirmPlanBodySchema = z.object({
	startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'startDate must be YYYY-MM-DD format').optional()
}).strict()

// ============================================================
// CALENDAR QUERY
// ============================================================

export const CalendarQuerySchema = z.object({
	from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'from must be YYYY-MM-DD format'),
	to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'to must be YYYY-MM-DD format')
}).strict()
