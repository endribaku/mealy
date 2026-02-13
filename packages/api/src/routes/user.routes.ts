import { Router } from 'express'
import { UserController } from '../controllers/user.controller'

export function createUserRoutes(
	controller: UserController
): Router {

	const router = Router()

	router.post('/', controller.create.bind(controller))
	router.get('/:userId', controller.getById.bind(controller))
	router.put('/:userId/profile', controller.updateProfile.bind(controller))

	return router
}
