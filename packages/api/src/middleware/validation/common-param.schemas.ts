import { z } from 'zod'

// ============================================================
// COMMON PARAM SCHEMAS
// ============================================================

export const UserIdParamsSchema = z.object({
	userId: z.uuid()
})

export const SessionParamsSchema = z.object({
	sessionId: z.uuid()
})

export const PlanParamsSchema = z.object({
	planId: z.uuid()
})

// ===================a=========================================
// EMPTY BODY
// ============================================================

export const EmptyBodySchema = z.object({})
