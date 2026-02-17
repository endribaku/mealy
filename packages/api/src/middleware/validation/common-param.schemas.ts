import { z } from 'zod'

// ============================================================
// COMMON PARAM SCHEMAS
// ============================================================

export const UserIdParamsSchema = z.object({
	userId: z.uuid()
})

export const SessionParamsSchema = z.object({
	userId: z.uuid(),
	sessionId: z.uuid()
})

export const PlanParamsSchema = z.object({
	userId: z.uuid(),
	planId: z.uuid()
})

// ============================================================
// EMPTY BODY
// ============================================================

export const EmptyBodySchema = z.object({})
