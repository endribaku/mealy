import express from 'express'
import helmet from 'helmet'
import cors from 'cors'

import { correlationIdMiddleware } from '../middleware/correlation/correlation.middleware'
import { httpLogger } from '../middleware/http-logger/http-logger.middleware'

import { createApiRouter } from '../routes/routes.api'
import { API_PREFIX } from '../routes/routes.constants'

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
  enableAuth?: boolean,
  enableLogging?: boolean
  testUser?: { id: string }
}

export function createApp({
  dataAccess,
  contextBuilder,
  generator,
  corsOrigin = '*',
  enableAuth = false,
  enableLogging,
  testUser
}: AppDependencies) {

      const app = express()

      // ----------------------------
      // Global Middleware
      // ----------------------------

      app.use(helmet())

      app.use(cors({
        origin: corsOrigin,
        credentials: true
      }))

      app.set('trust proxy', 1)

      app.use(express.json())
      
      const shouldLog =
        enableLogging

      if (shouldLog) {
        app.use(correlationIdMiddleware)
        app.use(httpLogger)
      }

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

      // ----------------------------
      // Services
      // ----------------------------

      const mealPlanService = new MealPlanService(
        dataAccess,
        contextBuilder,
        generator
      )

      const userService = new UserService(dataAccess)
      const sessionService = new SessionService(dataAccess)

      // ----------------------------
      // Controllers
      // ----------------------------

      const mealPlanController = new MealPlanController(mealPlanService)
      const sessionController = new SessionController(sessionService)
      const userController = new UserController(userService)

      // ----------------------------
      // Authentication
      // ----------------------------
      let authMiddleware: any

      if (enableAuth) {
        authMiddleware = require('../middleware/authentication/auth.middleware').authMiddleware
        app.use(API_PREFIX, authMiddleware)
      }

      if (!enableAuth && testUser) {
        app.use(API_PREFIX, (req, _res, next) => {
          (req as any).user = testUser
          next()
        })
      }
      
      // ----------------------------
      // Centralized Router
      // ----------------------------


      app.use(
        API_PREFIX,
        createApiRouter({
          userController,
          sessionController,
          mealPlanController,
          aiLimiter
        })
      )

      // ----------------------------
      // Error Handling
      // ----------------------------

      app.use(notFoundHandler)
      app.use(globalErrorHandler)

      return app
}
