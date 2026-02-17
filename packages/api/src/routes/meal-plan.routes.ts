import { Router } from 'express'
import { MealPlanController } from '../controllers/meal-plan.controller'
import { RateLimitRequestHandler } from 'express-rate-limit'
import { validate } from '../middleware/validation/validate'

import {
	UserIdParamsSchema,
	SessionParamsSchema,
	PlanParamsSchema
} from '../middleware/validation/common-param.schemas'

import {
	GenerateMealPlanBodySchema,
	RegenerateSingleBodySchema,
	RegenerateFullBodySchema
} from '../middleware/validation/meal-plan.schemas'

export function createMealPlanRoutes(
	controller: MealPlanController,
	aiLimiter: RateLimitRequestHandler
) {
	const router = Router()

	// ============================================================
	// GENERATE NEW PLAN
	// ============================================================

	router.post(
		'/:userId/meal-plans',
		aiLimiter,
		validate(UserIdParamsSchema, 'params'),
		validate(GenerateMealPlanBodySchema, 'body'),
		controller.generate.bind(controller)
	)

	// ============================================================
	// REGENERATE SINGLE MEAL
	// ============================================================

	router.post(
		'/:userId/sessions/:sessionId/regenerate-meal',
		aiLimiter,
		validate(SessionParamsSchema, 'params'),
		validate(RegenerateSingleBodySchema, 'body'),
		controller.regenerateSingle.bind(controller)
	)

	// ============================================================
	// REGENERATE FULL PLAN
	// ============================================================

	router.post(
		'/:userId/sessions/:sessionId/regenerate',
		aiLimiter,
		validate(SessionParamsSchema, 'params'),
		validate(RegenerateFullBodySchema, 'body'),
		controller.regenerateFull.bind(controller)
	)

	// ============================================================
	// CONFIRM PLAN
	// ============================================================

	router.post(
		'/:userId/sessions/:sessionId/confirm',
		validate(SessionParamsSchema, 'params'),
		controller.confirm.bind(controller)
	)

	// ============================================================
	// GET HISTORY
	// ============================================================

	router.get(
		'/:userId/meal-plans',
		validate(UserIdParamsSchema, 'params'),
		controller.getAll.bind(controller)
	)

	// ============================================================
	// GET SINGLE PLAN
	// ============================================================

	router.get(
		'/:userId/meal-plans/:planId',
		validate(PlanParamsSchema, 'params'),
		controller.getById.bind(controller)
	)

	// ============================================================
	// DELETE PLAN
	// ============================================================

	router.delete(
		'/:userId/meal-plans/:planId',
		validate(PlanParamsSchema, 'params'),
		controller.delete.bind(controller)
	)

	return router
}
