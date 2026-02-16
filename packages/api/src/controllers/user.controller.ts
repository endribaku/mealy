import { Request, Response, NextFunction } from 'express'
import { UserService } from '../services/user.service'

export class UserController {

	constructor(
		private readonly service: UserService
	) {}

	// ============================================================
	// GET USER BY ID
	// ============================================================

	async getById(
		req: Request<{ userId: string }>,
		res: Response,
		next: NextFunction
	) {
		try {
			const { userId } = req.params

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
	// CREATE USER
	// ============================================================

	async create(
		req: Request,
		res: Response,
		next: NextFunction
	) {
		try {
			const user = await this.service.create(req.body)

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
	// ============================================================

	async updateProfile(
		req: Request<{ userId: string }>,
		res: Response,
		next: NextFunction
	) {
		try {
			const { userId } = req.params

			const updatedUser = await this.service.updateProfile(
				userId,
				req.body
			)

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
	// ============================================================

	async updatePreferences(
		req: Request<{ userId: string }>,
		res: Response,
		next: NextFunction
	) {
		try {
			const { userId } = req.params

			const updatedUser = await this.service.updatePreferences(
				userId,
				req.body
			)

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
	// ============================================================

	async updateRestrictions(
		req: Request<{ userId: string }>,
		res: Response,
		next: NextFunction
	) {
		try {
			const { userId } = req.params

			const updatedUser = await this.service.updateRestrictions(
				userId,
				req.body
			)

			return res.json({
				success: true,
				data: updatedUser
			})
		} catch (error) {
			next(error)
		}
	}

	// ============================================================
	// DELETE USER
	// ============================================================

	async delete(
		req: Request<{ userId: string }>,
		res: Response,
		next: NextFunction
	) {
		try {
			const { userId } = req.params

			await this.service.delete(userId)

			return res.json({
				success: true,
				data: { deleted: true }
			})
		} catch (error) {
			next(error)
		}
	}
}
