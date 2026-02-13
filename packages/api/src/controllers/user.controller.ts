import { Request, Response, NextFunction } from 'express'
import { IDataAccess } from '@mealy/engine'

export class UserController {

	constructor(private dataAccess: IDataAccess) {}

	async create(
		req: Request,
		res: Response,
		next: NextFunction
	) {
		try {
			const user = await this.dataAccess.createUser(req.body)

			return res.status(201).json({
				success: true,
				data: user
			})

		} catch (error) {
			next(error)
		}
	}

	async getById(
		req: Request,
		res: Response,
		next: NextFunction
	) {
		try {
			const { userId } = req.params

			const user = await this.dataAccess.findUserById(userId as string)

			if (!user) {
				return res.status(404).json({
					success: false,
					message: 'User not found'
				})
			}

			return res.json({
				success: true,
				data: user
			})

		} catch (error) {
			next(error)
		}
	}

	async updateProfile(
		req: Request,
		res: Response,
		next: NextFunction
	) {
		try {
			const { userId } = req.params

			const user =
				await this.dataAccess.updateUserProfile(
					userId as string,
					req.body
				)

			return res.json({
				success: true,
				data: user
			})

		} catch (error) {
			next(error)
		}
	}
}
