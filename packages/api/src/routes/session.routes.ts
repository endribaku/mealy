import { Router } from 'express'
import { validateRequest } from 'zod-express-middleware'
import { SessionController } from '../controllers/session.controller'

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
		validateRequest({ params: SessionParamsSchema }),
		controller.getById.bind(controller)
	)

	// ============================================================
	// DELETE SESSION
	// ============================================================

	router.delete(
		'/:userId/sessions/:sessionId',
		validateRequest({ params: SessionParamsSchema }),
		controller.delete.bind(controller)
	)

	return router
}
