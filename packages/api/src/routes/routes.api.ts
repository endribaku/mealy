import { Router } from 'express'
import { ROUTE_SEGMENTS } from './routes.constants'

import type { UserController } from '../controllers/user.controller'
import type { SessionController } from '../controllers/session.controller'
import type { MealPlanController } from '../controllers/meal-plan.controller'
import type { RateLimitRequestHandler } from 'express-rate-limit'

import { createUserRoutes } from './user.routes'
import { createSessionRoutes } from './session.routes'
import { createMealPlanRoutes } from './meal-plan.routes'

interface RouteDependencies {
  userController: UserController
  sessionController: SessionController
  mealPlanController: MealPlanController
  aiLimiter: RateLimitRequestHandler
}

export function createApiRouter(deps: RouteDependencies) {
  const router = Router()

  router.use(
    `/${ROUTE_SEGMENTS.USERS}`,
    createUserRoutes(deps.userController)
  )

  router.use(
    `/${ROUTE_SEGMENTS.SESSIONS}`,
    createSessionRoutes(deps.sessionController)
  )

  router.use(
    `/${ROUTE_SEGMENTS.MEAL_PLANS}`,
    createMealPlanRoutes(deps.mealPlanController, deps.aiLimiter)
  )

  return router
}
