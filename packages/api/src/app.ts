import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import morgan from 'morgan'
import { SupabaseDataAccess } from '@mealy/data'
import { MealPlanService } from './services/meal-plan.service'

import { MealPlanController } from './controllers/meal-plan.controller'
import { SessionController } from './controllers/session.controller'
import { UserController } from './controllers/user.controller'

import { createUserRoutes } from './routes/user.routes'
import { createSessionRoutes } from './routes/session.routes'
import { createMealPlanRoutes } from './routes/meal-plan.routes'
import { globalErrorHandler } from './middleware/error/global-error.middleware'

export function createApp() {

	const app = express()

    // security middleware
    
    app.use(helmet())

	app.use(cors({
		origin: process.env.CORS_ORIGIN || '*',
		credentials: true
	}))

	// Parse JSON first
	app.use(express.json())

	// HTTP request logging
	app.use(morgan('dev'))

	// Infrastructure
	const dataAccess = new SupabaseDataAccess()

	// Services
	const mealPlanService = new MealPlanService(dataAccess)

	// Controllers
	const mealPlanController = new MealPlanController(mealPlanService)
	const sessionController = new SessionController(mealPlanService)
	const userController = new UserController(dataAccess)

	// Routes
	app.use('/api/users',
		createUserRoutes(userController)
	)

	app.use('/api/meal-plans',
		createMealPlanRoutes(mealPlanController)
	)

	app.use('/api/sessions',
		createSessionRoutes(sessionController)
	)

	// ✅ Global error handler MUST be last
	app.use(globalErrorHandler)

	return app
}
