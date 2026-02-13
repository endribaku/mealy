import { Request, Response, NextFunction } from 'express'
import { MealPlanService } from '../services/meal-plan.service'

export class SessionController {

	constructor(private service: MealPlanService) {}

	async getById(
		req: Request,
		res: Response,
		next: NextFunction
	) {
		try {
			const { sessionId } = req.params

			// You may later add a service method for this
			return res.json({
				success: true,
				data: sessionId
			})

		} catch (error) {
			next(error)
		}
	}

	async regenerateSingle(
		req: Request,
		res: Response,
		next: NextFunction
	) {
		try {
			const { sessionId } = req.params
			const { userId, mealId, reason } = req.body

			const result =
				await this.service.regenerateSingleMeal(
					userId,
					sessionId as string,
					mealId,
					reason
				)

			return res.json({
				success: true,
				data: result
			})

		} catch (error) {
			next(error)
		}
	}

	async regenerateFull(
		req: Request,
		res: Response,
		next: NextFunction
	) {
		try {
			const { sessionId } = req.params
			const { userId, reason } = req.body

			const result =
				await this.service.regenerateFullPlan(
					userId,
					sessionId as string,
					reason
				)

			return res.json({
				success: true,
				data: result
			})

		} catch (error) {
			next(error)
		}
	}

	async confirm(
		req: Request,
		res: Response,
		next: NextFunction
	) {
		try {
			const { sessionId } = req.params
			const { userId } = req.body

			const result =
				await this.service.confirmMealPlan(
					userId,
					sessionId as string
				)

			return res.json({
				success: true,
				data: result
			})

		} catch (error) {
			next(error)
		}
	}

	async delete(
		req: Request,
		res: Response,
		next: NextFunction
	) {
		try {
			const { sessionId } = req.params

			// Optional future implementation
			return res.json({
				success: true
			})

		} catch (error) {
			next(error)
		}
	}
}
