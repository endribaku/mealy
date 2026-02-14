import { Router } from 'express'
import { validateRequest } from 'zod-express-middleware'
import { MealPlanController } from '../controllers/meal-plan.controller'
import {
	GenerateMealPlanParamsSchema,
	GenerateMealPlanBodySchema,
	RegenerateSingleParamsSchema,
	RegenerateSingleBodySchema,
	ConfirmMealPlanParamsSchema,
	ConfirmMealPlanBodySchema
} from '../middleware/validation/meal-plan.schemas'

export function createMealPlanRoutes(
	controller: MealPlanController
) {
	const router = Router()

	router.post(
		'/users/:userId',
		validateRequest({
			params: GenerateMealPlanParamsSchema,
			body: GenerateMealPlanBodySchema
		}),
		controller.generate.bind(controller)
	)

	router.post(
		'/sessions/:sessionId/regenerate',
		validateRequest({
			params: RegenerateSingleParamsSchema,
			body: RegenerateSingleBodySchema
		}),
		controller.regenerateSingle.bind(controller)
	)

	router.post(
		'/sessions/:sessionId/confirm',
		validateRequest({
			params: ConfirmMealPlanParamsSchema,
			body: ConfirmMealPlanBodySchema
		}),
		controller.confirm.bind(controller)
	)

	return router
}
