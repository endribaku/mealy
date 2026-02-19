import { Request, Response, NextFunction } from 'express'
import { UserService } from '../services/user.service'
import { logger } from '../misc/logger'

export class UserController {

	constructor(
		private readonly service: UserService
	) {}

	// ============================================================
	// GET CURRENT USER
	// GET /api/users/me
	// ============================================================

	async getById(
		req: Request,
		res: Response,
		next: NextFunction
	) {
		try {
			const userId = (req as any).user.id

			const user = await this.service.getById(userId)

			return res.json({
				success: true,
				data: user
			})
		} catch (error) {
			next(error)
		}
	}

	// ============================================================
	// CREATE USER (public)
	// POST /api/users
	// ============================================================

	async create(
		req: Request,
		res: Response,
		next: NextFunction
	) {
		try {

			logger.info({
				event: 'user_create_requested'
			})

			const user = await this.service.create(req.body)

			logger.info({
				event: 'user_create_success',
				userId: user.id
			})

			return res.status(201).json({
				success: true,
				data: user
			})
		} catch (error) {
			next(error)
		}
	}

	// ============================================================
	// UPDATE PROFILE
	// PATCH /api/users/me/profile
	// ============================================================

	async updateProfile(
		req: Request,
		res: Response,
		next: NextFunction
	) {
		try {
			const userId = (req as any).user.id

			logger.info({
				event: 'user_update_profile_requested',
				userId
			})

			const updatedUser = await this.service.updateProfile(
				userId,
				req.body
			)

			logger.info({
				event: 'user_update_profile_success',
				userId
			})

			return res.json({
				success: true,
				data: updatedUser
			})
		} catch (error) {
			next(error)
		}
	}

	// ============================================================
	// UPDATE LEARNED PREFERENCES
	// PATCH /api/users/me/preferences
	// ============================================================

	async updatePreferences(
		req: Request,
		res: Response,
		next: NextFunction
	) {
		try {
			const userId = (req as any).user.id

			logger.info({
				event: 'user_update_preferences_requested',
				userId
			})

			const updatedUser = await this.service.updatePreferences(
				userId,
				req.body
			)

			logger.info({
				event: 'user_update_preferences_success',
				userId
			})

			return res.json({
				success: true,
				data: updatedUser
			})
		} catch (error) {
			next(error)
		}
	}

	// ============================================================
	// UPDATE DIETARY RESTRICTIONS
	// PATCH /api/users/me/restrictions
	// ============================================================

	async updateRestrictions(
		req: Request,
		res: Response,
		next: NextFunction
	) {
		try {
			const userId = (req as any).user.id

			logger.info({
				event: 'user_update_restrictions_requested',
				userId
			})

			const updatedUser = await this.service.updateRestrictions(
				userId,
				req.body
			)

			logger.info({
				event: 'user_update_restrictions_success',
				userId
			})

			return res.json({
				success: true,
				data: updatedUser
			})
		} catch (error) {
			next(error)
		}
	}

	// ============================================================
	// DELETE CURRENT USER
	// DELETE /api/users/me
	// ============================================================

	async delete(
		req: Request,
		res: Response,
		next: NextFunction
	) {
		try {
			const userId = (req as any).user.id

			logger.warn({
				event: 'user_delete_requested',
				userId
			})

			await this.service.delete(userId)
			
			logger.warn({
				event: 'user_delete_success',
				userId
			})

			return res.json({
				success: true,
				data: { deleted: true }
			})
		} catch (error) {
			next(error)
		}
	}
}
