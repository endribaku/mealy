import { Router } from 'express'
import { MealPlanController } from '../controllers/meal-plan.controller'
import type { RateLimitRequestHandler } from 'express-rate-limit'
import { validate } from '../middleware/validation/validate'

import { ROUTE_SEGMENTS } from './routes.constants'

import {
	SessionParamsSchema,
	PlanParamsSchema
} from '../middleware/validation/common-param.schemas'

import {
	GenerateMealPlanBodySchema,
	RegenerateSingleBodySchema,
	RegenerateFullBodySchema,
	ConfirmPlanBodySchema,
	CalendarQuerySchema
} from '../middleware/validation/meal-plan.schemas'

export function createMealPlanRoutes(
	controller: MealPlanController,
	aiLimiter: RateLimitRequestHandler
) {
	const router = Router()

	// =========================
	// CONSTANT PARAM SEGMENTS
	// =========================

	const sessionParam = `/:${ROUTE_SEGMENTS.SESSION_ID}`
	const planParam = `/:${ROUTE_SEGMENTS.PLAN_ID}`

	const regenerate = `/${ROUTE_SEGMENTS.REGENERATE}`
	const regenerateMeal = `/${ROUTE_SEGMENTS.REGENERATE_MEAL}`
	const confirm = `/${ROUTE_SEGMENTS.CONFIRM}`

	// ============================================================
	// POST /meal-plans
	// ============================================================

	router.post(
		'/',
		aiLimiter,
		validate(GenerateMealPlanBodySchema, 'body'),
		controller.generate.bind(controller)
	)

	// ============================================================
	// GET /meal-plans
	// ============================================================

	router.get(
		'/',
		controller.getAll.bind(controller)
	)

	// ============================================================
	// GET /meal-plans/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD
	// ============================================================

	router.get(
		'/calendar',
		validate(CalendarQuerySchema, 'query'),
		controller.getCalendar.bind(controller)
	)

	// ============================================================
	// GET /meal-plans/:planId
	// ============================================================

	router.get(
		planParam,
		validate(PlanParamsSchema, 'params'),
		controller.getById.bind(controller)
	)

	// ============================================================
	// DELETE /meal-plans/:planId
	// ============================================================

	router.delete(
		planParam,
		validate(PlanParamsSchema, 'params'),
		controller.delete.bind(controller)
	)

	// ============================================================
	// POST /sessions/:sessionId/regenerate
	// ============================================================

	router.post(
		`/${ROUTE_SEGMENTS.SESSIONS}${sessionParam}${regenerate}`,
		aiLimiter,
		validate(SessionParamsSchema, 'params'),
		validate(RegenerateFullBodySchema, 'body'),
		controller.regenerateFull.bind(controller)
	)

	// ============================================================
	// POST /sessions/:sessionId/regenerate-meal
	// ============================================================

	router.post(
		`/${ROUTE_SEGMENTS.SESSIONS}${sessionParam}${regenerateMeal}`,
		aiLimiter,
		validate(SessionParamsSchema, 'params'),
		validate(RegenerateSingleBodySchema, 'body'),
		controller.regenerateSingle.bind(controller)
	)

	// ============================================================
	// POST /sessions/:sessionId/confirm
	// ============================================================

	router.post(
		`/${ROUTE_SEGMENTS.SESSIONS}${sessionParam}${confirm}`,
		validate(SessionParamsSchema, 'params'),
		validate(ConfirmPlanBodySchema, 'body'),
		controller.confirm.bind(controller)
	)

	return router
}
