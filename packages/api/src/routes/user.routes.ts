import { Router } from 'express'
import { UserController } from '../controllers/user.controller'
import { validate } from '../middleware/validation/validate'

import {
	UserIdParamsSchema
} from '../middleware/validation/common-param.schemas'

import {
	CreateUserBodySchema,
	UpdateProfileBodySchema,
	UpdatePreferencesBodySchema,
	UpdateRestrictionsBodySchema
} from '../middleware/validation/user.schemas'

export function createUserRoutes(
	controller: UserController
) {
	const router = Router()

	// ============================================================
	// CREATE USER
	// ============================================================

	router.post(
		'/',
		validate(CreateUserBodySchema, 'body'),
		controller.create.bind(controller)
	)

	// ============================================================
	// GET USER
	// ============================================================

	router.get(
		'/:userId',
		validate(UserIdParamsSchema, 'params'),
		controller.getById.bind(controller)
	)

	// ============================================================
	// UPDATE PROFILE
	// ============================================================

	router.patch(
		'/:userId/profile',
		validate(UserIdParamsSchema, 'params'),
		validate(UpdateProfileBodySchema, 'body'),
		controller.updateProfile.bind(controller)
	)

	// ============================================================
	// UPDATE PREFERENCES
	// ============================================================

	router.patch(
		'/:userId/preferences',
		validate(UserIdParamsSchema, 'params'),
		validate(UpdatePreferencesBodySchema, 'body'),
		controller.updatePreferences.bind(controller)
	)

	// ============================================================
	// UPDATE RESTRICTIONS
	// ============================================================

	router.patch(
		'/:userId/restrictions',
		validate(UserIdParamsSchema, 'params'),
		validate(UpdateRestrictionsBodySchema, 'body'),
		controller.updateRestrictions.bind(controller)
	)

	// ============================================================
	// DELETE USER
	// ============================================================

	router.delete(
		'/:userId',
		validate(UserIdParamsSchema, 'params'),
		controller.delete.bind(controller)
	)

	return router
}
