import { Router } from 'express'
import { validateRequest } from 'zod-express-middleware'
import { MealPlanController } from '../controllers/meal-plan.controller'
import { RateLimitRequestHandler } from 'express-rate-limit'
import {
	UserIdParamsSchema,
	SessionParamsSchema,
	PlanParamsSchema
} from '../middleware/validation/common-param.schemas.ts'

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
		validateRequest({
			params: UserIdParamsSchema,
			body: GenerateMealPlanBodySchema
		}),
		controller.generate.bind(controller)
	)

	// ============================================================
	// REGENERATE SINGLE MEAL
	// ============================================================

	router.post(
		'/:userId/sessions/:sessionId/regenerate-meal',
        aiLimiter,
		validateRequest({
			params: SessionParamsSchema,
			body: RegenerateSingleBodySchema
		}),
		controller.regenerateSingle.bind(controller)
	)

	// ============================================================
	// REGENERATE FULL PLAN
	// ============================================================

	router.post(
		'/:userId/sessions/:sessionId/regenerate',
        aiLimiter,
		validateRequest({
			params: SessionParamsSchema,
			body: RegenerateFullBodySchema
		}),
		controller.regenerateFull.bind(controller)
	)

	// ============================================================
	// CONFIRM PLAN
	// ============================================================

	router.post(
		'/:userId/sessions/:sessionId/confirm',
		validateRequest({
			params: SessionParamsSchema
		}),
		controller.confirm.bind(controller)
	)

	// ============================================================
	// GET HISTORY
	// ============================================================

	router.get(
		'/:userId/meal-plans',
		validateRequest({ params: UserIdParamsSchema }),
		controller.getAll.bind(controller)
	)

	// ============================================================
	// GET SINGLE PLAN
	// ============================================================

	router.get(
		'/:userId/meal-plans/:planId',
		validateRequest({ params: PlanParamsSchema }),
		controller.getById.bind(controller)
	)

	// ============================================================
	// DELETE PLAN
	// ============================================================

	router.delete(
		'/:userId/meal-plans/:planId',
		validateRequest({ params: PlanParamsSchema }),
		controller.delete.bind(controller)
	)

	return router
}
