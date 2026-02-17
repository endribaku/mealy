import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import morgan from 'morgan'
import { SupabaseDataAccess } from '@mealy/data'
import {ContextBuilder, MealPlanGenerator} from '@mealy/engine'

import { MealPlanService } from './services/meal-plan.service'

import { MealPlanController } from './controllers/meal-plan.controller'
import { SessionController } from './controllers/session.controller'
import { UserController } from './controllers/user.controller'

import { createUserRoutes } from './routes/user.routes'
import { createSessionRoutes } from './routes/session.routes'
import { createMealPlanRoutes } from './routes/meal-plan.routes'
import { globalErrorHandler, notFoundHandler } from './middleware/error/global-error.middleware'
import { createRateLimiter } from './middleware/rate-limiter/rate-limiter.middleware'
import { UserService } from './services/user.service'
import { SessionService } from './services/session.service'


export function createApp() {

	const app = express()

    // security middleware
    
    app.use(helmet())

	app.use(cors({
		origin: process.env.CORS_ORIGIN || '*',
		credentials: true
	}))

	// Parse JSON first
    app.set('trust proxy', 1)

	app.use(express.json())

	// HTTP request logging
	app.use(morgan('dev'))

    // rate limiter logic
    

	// Global limiter
	app.use(
		createRateLimiter({
			windowMs: 15 * 60 * 1000,
			max: 100
		})
	)

    // ai-specific limiter
    const aiLimiter = createRateLimiter({
        windowMs: 60 * 1000,
        max: 10,
        message: 'AI generation limit exceeded'
    })


	// Infrastructure and other service dependencies
	const dataAccess = new SupabaseDataAccess()
    const contextBuilder = new ContextBuilder()
    const generator = new MealPlanGenerator()

	// Services
	const mealPlanService = new MealPlanService(dataAccess, contextBuilder, generator)
    const userService = new UserService(dataAccess)
    const sessionService = new SessionService(dataAccess)

	// Controllers
	const mealPlanController = new MealPlanController(mealPlanService)
	const sessionController = new SessionController(sessionService)
	const userController = new UserController(userService)

	// Routes
	app.use('/api/users', createUserRoutes(userController))
    app.use('/api/users', createSessionRoutes(sessionController))
    app.use('/api/users', createMealPlanRoutes(mealPlanController, aiLimiter))


	// 404 handler
    app.use(notFoundHandler)

    // Error handler
    app.use(globalErrorHandler)

	return app
}
