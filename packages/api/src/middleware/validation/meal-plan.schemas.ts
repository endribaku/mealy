import { z } from 'zod'

export const GenerateMealPlanParamsSchema = z.object({
	userId: z.string().uuid()
})

export const GenerateMealPlanBodySchema = z.object({
	options: z.object({
		provider: z.enum(['openai', 'anthropic']).optional(),
		temperature: z.number().min(0).max(1).optional(),
		maxTokens: z.number().positive().optional(),
	}).optional()
})

export const RegenerateSingleParamsSchema = z.object({
	sessionId: z.string().uuid()
})

export const RegenerateSingleBodySchema = z.object({
	userId: z.string().uuid(),
	mealId: z.string(),
	reason: z.string().min(1)
})

export const ConfirmMealPlanParamsSchema = z.object({
	sessionId: z.string().uuid()
})

export const ConfirmMealPlanBodySchema = z.object({
	userId: z.string().uuid()
})
