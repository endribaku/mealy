import { Router } from 'express'
import { MealPlanController } from '../controllers/meal-plan.controller'

export function createMealPlanRoutes(
	controller: MealPlanController
): Router {

	const router = Router()

	router.post(
		'/users/:userId/sessions',
		controller.generate.bind(controller)
	)

	router.get(
		'/users/:userId/meal-plans',
		controller.getHistory.bind(controller)
	)

	router.get(
		'/users/:userId/meal-plans/:planId',
		controller.getById.bind(controller)
	)

	router.delete(
		'/users/:userId/meal-plans/:planId',
		controller.delete.bind(controller)
	)

	return router
}
