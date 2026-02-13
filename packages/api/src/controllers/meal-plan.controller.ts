import { Request, Response, NextFunction } from 'express'
import { MealPlanService } from '../services/meal-plan.service'
import {
	GenerateMealPlanRequest,
	GenerateMealPlanResponse,
	BasicSuccessResponse,
	ErrorResponse
} from '../types/dto.types'

export class MealPlanController {

	constructor(private service: MealPlanService) {}

	async generate(
	req: Request,
	res: Response,
	next: NextFunction
    ) {
        try {
            const { userId } = req.params
            const body = req.body as GenerateMealPlanRequest

            if (!userId) {
                const error: ErrorResponse = {
                    success: false,
                    message: 'userId is required'
                }
                return res.status(400).json(error)
            }

            const serviceResult = await this.service.generateMealPlan(
                userId as string,
                body.options
            )

            const responseData: GenerateMealPlanResponse = {
                sessionId: serviceResult.sessionId,
                mealPlan: serviceResult.mealPlan,
                metadata: {
                    tokensUsed: serviceResult.metadata.tokensUsed ?? 0,
                    generationTime: serviceResult.metadata.generationTime
                }
            }

            const response: BasicSuccessResponse<GenerateMealPlanResponse> = {
                success: true,
                data: responseData
            }

            return res.status(201).json(response)

        } catch (error) {
            next(error)
        }
    }


	async getHistory(
		req: Request,
		res: Response,
		next: NextFunction
	) {
		try {
			const { userId } = req.params

			const plans = await this.service.getMealPlanHistory(userId as string)

			return res.json({
				success: true,
				data: plans
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
			const { userId, planId } = req.params

			const plan = await this.service.getMealPlanById(
				userId as string,
				planId as string
			)

			return res.json({
				success: true,
				data: plan
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
			const { userId, planId } = req.params

			await this.service.deleteMealPlan(
				userId as string,
				planId as string
			)

			return res.json({
				success: true
			})

		} catch (error) {
			next(error)
		}
	}
}
