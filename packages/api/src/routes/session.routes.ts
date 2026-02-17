import { Router } from 'express'
import { SessionController } from '../controllers/session.controller'
import { validate } from '../middleware/validation/validate'

import {
	SessionParamsSchema
} from '../middleware/validation/common-param.schemas'

export function createSessionRoutes(
	controller: SessionController
) {
	const router = Router()

	// ============================================================
	// GET SESSION
	// ============================================================

	router.get(
		'/:userId/sessions/:sessionId',
		validate(SessionParamsSchema, 'params'),
		controller.getById.bind(controller)
	)

	// ============================================================
	// DELETE SESSION
	// ============================================================

	router.delete(
		'/:userId/sessions/:sessionId',
		validate(SessionParamsSchema, 'params'),
		controller.delete.bind(controller)
	)

	return router
}
