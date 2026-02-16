import { z } from 'zod'

// ============================================================
// COMMON PARAM SCHEMAS
// ============================================================

export const UserIdParamsSchema = z.object({
	userId: z.string().min(1)
})

export const SessionParamsSchema = z.object({
	userId: z.string().min(1),
	sessionId: z.string().min(1)
})

export const PlanParamsSchema = z.object({
	userId: z.string().min(1),
	planId: z.string().min(1)
})

// ============================================================
// EMPTY BODY
// ============================================================

export const EmptyBodySchema = z.object({})
