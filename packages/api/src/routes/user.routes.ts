import { Router } from 'express'
import { validateRequest } from 'zod-express-middleware'
import { UserController } from '../controllers/user.controller'

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
		validateRequest({ body: CreateUserBodySchema }),
		controller.create.bind(controller)
	)

	// ============================================================
	// GET USER
	// ============================================================

	router.get(
		'/:userId',
		validateRequest({ params: UserIdParamsSchema }),
		controller.getById.bind(controller)
	)

	// ============================================================
	// UPDATE PROFILE
	// ============================================================

	router.patch(
		'/:userId/profile',
		validateRequest({
			params: UserIdParamsSchema,
			body: UpdateProfileBodySchema
		}),
		controller.updateProfile.bind(controller)
	)

	// ============================================================
	// UPDATE PREFERENCES
	// ============================================================

	router.patch(
		'/:userId/preferences',
		validateRequest({
			params: UserIdParamsSchema,
			body: UpdatePreferencesBodySchema
		}),
		controller.updatePreferences.bind(controller)
	)

	// ============================================================
	// UPDATE RESTRICTIONS
	// ============================================================

	router.patch(
		'/:userId/restrictions',
		validateRequest({
			params: UserIdParamsSchema,
			body: UpdateRestrictionsBodySchema
		}),
		controller.updateRestrictions.bind(controller)
	)

	// ============================================================
	// DELETE USER
	// ============================================================

	router.delete(
		'/:userId',
		validateRequest({ params: UserIdParamsSchema }),
		controller.delete.bind(controller)
	)

	return router
}
