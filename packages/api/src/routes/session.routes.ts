import { Router } from 'express'
import { SessionController } from '../controllers/session.controller'

export function createSessionRoutes(
	controller: SessionController
): Router {

	const router = Router()

	router.get('/:sessionId', controller.getById.bind(controller))
	router.delete('/:sessionId', controller.delete.bind(controller))

	router.post('/:sessionId/regenerate',
		controller.regenerateSingle.bind(controller)
	)

	router.post('/:sessionId/regenerate-all',
		controller.regenerateFull.bind(controller)
	)

	router.post('/:sessionId/confirm',
		controller.confirm.bind(controller)
	)

	return router
}
