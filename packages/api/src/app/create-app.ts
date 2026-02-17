import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import morgan from 'morgan'

import { createUserRoutes } from '../routes/user.routes'
import { createSessionRoutes } from '../routes/session.routes'
import { createMealPlanRoutes } from '../routes/meal-plan.routes'

import { globalErrorHandler, notFoundHandler } from '../middleware/error/global-error.middleware'
import { createRateLimiter } from '../middleware/rate-limiter/rate-limiter.middleware'

import { UserController } from '../controllers/user.controller'
import { SessionController } from '../controllers/session.controller'
import { MealPlanController } from '../controllers/meal-plan.controller'

import { UserService } from '../services/user.service'
import { SessionService } from '../services/session.service'
import { MealPlanService } from '../services/meal-plan.service'

import {
  IDataAccess,
  IContextBuilder,
  IMealPlanGenerator
} from '@mealy/engine'

interface AppDependencies {
  dataAccess: IDataAccess
  contextBuilder: IContextBuilder
  generator: IMealPlanGenerator
  corsOrigin?: string
}

export function createApp({
  dataAccess,
  contextBuilder,
  generator,
  corsOrigin = '*'
}: AppDependencies) {

  const app = express()

  // ------------------------------------------------
  // Global Middleware (same order as before)
  // ------------------------------------------------

  app.use(helmet())

  app.use(cors({
    origin: corsOrigin,
    credentials: true
  }))

  app.set('trust proxy', 1)

  app.use(express.json())

  app.use(morgan('dev'))

  app.use(
    createRateLimiter({
      windowMs: 15 * 60 * 1000,
      max: 100
    })
  )

  const aiLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 10,
    message: 'AI generation limit exceeded'
  })

  // ------------------------------------------------
  // Services
  // ------------------------------------------------

  const mealPlanService = new MealPlanService(
    dataAccess,
    contextBuilder,
    generator
  )

  const userService = new UserService(dataAccess)
  const sessionService = new SessionService(dataAccess)

  // ------------------------------------------------
  // Controllers
  // ------------------------------------------------

  const mealPlanController = new MealPlanController(mealPlanService)
  const sessionController = new SessionController(sessionService)
  const userController = new UserController(userService)

  // ------------------------------------------------
  // Routes
  // ------------------------------------------------

  app.use('/api/users', createUserRoutes(userController))
  app.use('/api/users', createSessionRoutes(sessionController))
  app.use('/api/users', createMealPlanRoutes(mealPlanController, aiLimiter))

  // ------------------------------------------------
  // Error Handling
  // ------------------------------------------------

  app.use(notFoundHandler)
  app.use(globalErrorHandler)

  return app
}
