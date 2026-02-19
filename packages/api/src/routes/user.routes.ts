import { Router } from 'express'
import { UserController } from '../controllers/user.controller'
import { validate } from '../middleware/validation/validate'
import { ROUTE_SEGMENTS } from './routes.constants'

import {
	CreateUserBodySchema,
	UpdateProfileBodySchema,
	UpdatePreferencesBodySchema,
	UpdateRestrictionsBodySchema
} from '../middleware/validation/user.schemas'

export function createUserRoutes(controller: UserController) {
	const router = Router()

	const me = `/${ROUTE_SEGMENTS.ME}`
	const profile = `/${ROUTE_SEGMENTS.PROFILE}`
	const preferences = `/${ROUTE_SEGMENTS.PREFERENCES}`
	const restrictions = `/${ROUTE_SEGMENTS.RESTRICTIONS}`

	// POST /users/
	router.post(
		'/',
		validate(CreateUserBodySchema, 'body'),
		controller.create.bind(controller)
	)

	// GET /users/me
	router.get(
		me,
		controller.getById.bind(controller)
	)

	// PATCH /users/me/profile
	router.patch(
		`${me}${profile}`,
		validate(UpdateProfileBodySchema, 'body'),
		controller.updateProfile.bind(controller)
	)

	// PATCH /users/me/preferences
	router.patch(
		`${me}${preferences}`,
		validate(UpdatePreferencesBodySchema, 'body'),
		controller.updatePreferences.bind(controller)
	)

	// PATCH /users/me/restrictions
	router.patch(
		`${me}${restrictions}`,
		validate(UpdateRestrictionsBodySchema, 'body'),
		controller.updateRestrictions.bind(controller)
	)

	// DELETE /users/me
	router.delete(
		me,
		controller.delete.bind(controller)
	)

	return router
}

