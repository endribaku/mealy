import { Router } from 'express'
import { SessionController } from '../controllers/session.controller'
import { validate } from '../middleware/validation/validate'

import { ROUTE_SEGMENTS } from './routes.constants'
import { SessionParamsSchema } from '../middleware/validation/common-param.schemas'

export function createSessionRoutes(
	controller: SessionController
) {
	const router = Router()

	const sessionParam = `/:${ROUTE_SEGMENTS.SESSION_ID}`

	// ============================================================
	// GET /sessions/:sessionId
	// ============================================================

	router.get(
		sessionParam,
		validate(SessionParamsSchema, 'params'),
		controller.getById.bind(controller)
	)

	// ============================================================
	// DELETE /sessions/:sessionId
	// ============================================================

	router.delete(
		sessionParam,
		validate(SessionParamsSchema, 'params'),
		controller.delete.bind(controller)
	)

	return router
}
