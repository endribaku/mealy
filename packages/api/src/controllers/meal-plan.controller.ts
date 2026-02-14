import { Request, Response, NextFunction } from 'express'
import { MealPlanService } from '../services/meal-plan.service'
import { GenerationOptions, MealPlan } from '@mealy/engine'

import {
	GenerateMealPlanResponse,
	BasicSuccessResponse
} from '../types/dto.types'

import { StoredMealPlan } from '@mealy/engine'

export class MealPlanController {

	constructor(
		private readonly service: MealPlanService
	) {}

	// ============================================================
	// GENERATE NEW PLAN
	// POST /api/users/:userId/meal-plans
	// ============================================================

	async generate(
		req: Request<
			{ userId: string },
			BasicSuccessResponse<GenerateMealPlanResponse>,
			{ options?: GenerationOptions }
		>,
		res: Response,
		next: NextFunction
	) {
		try {

			const { userId } = req.params
			const { options } = req.body

			const result =
				await this.service.generateMealPlan(
					userId,
					options
				)

			const response: BasicSuccessResponse<GenerateMealPlanResponse> = {
				success: true,
				data: {
					sessionId: result.sessionId,
					mealPlan: result.mealPlan,
					metadata: {
						tokensUsed: result.metadata.tokensUsed,
						generationTime: result.metadata.generationTime
					}
				}
			}

			return res.status(201).json(response)

		} catch (error) {
			next(error)
		}
	}

	// ============================================================
	// REGENERATE SINGLE MEAL
	// POST /api/sessions/:sessionId/regenerate-meal
	// ============================================================

	async regenerateSingle(
		req: Request<
			{ sessionId: string },
			BasicSuccessResponse<{ mealPlan: MealPlan }>,
			{
				userId: string
				mealId: string
				reason: string
				options?: GenerationOptions
			}
		>,
		res: Response,
		next: NextFunction
	) {
		try {

			const { sessionId } = req.params
			const { userId, mealId, reason, options } = req.body

			const mealPlan =
				await this.service.regenerateSingleMeal(
					userId,
					sessionId,
					mealId,
					reason,
					options
				)

			const response: BasicSuccessResponse<{ mealPlan: MealPlan }> = {
				success: true,
				data: { mealPlan }
			}

			return res.json(response)

		} catch (error) {
			next(error)
		}
	}

	// ============================================================
	// REGENERATE FULL PLAN
	// POST /api/sessions/:sessionId/regenerate
	// ============================================================

	async regenerateFull(
		req: Request<
			{ sessionId: string },
			BasicSuccessResponse<{ mealPlan: MealPlan }>,
			{
				userId: string
				reason: string
				options?: GenerationOptions
			}
		>,
		res: Response,
		next: NextFunction
	) {
		try {

			const { sessionId } = req.params
			const { userId, reason, options } = req.body

			const mealPlan =
				await this.service.regenerateFullPlan(
					userId,
					sessionId,
					reason,
					options
				)

			const response: BasicSuccessResponse<{ mealPlan: MealPlan }> = {
				success: true,
				data: { mealPlan }
			}

			return res.json(response)

		} catch (error) {
			next(error)
		}
	}

	// ============================================================
	// CONFIRM PLAN
	// POST /api/sessions/:sessionId/confirm
	// ============================================================

	async confirm(
        req: Request<
            { sessionId: string },
            BasicSuccessResponse<{ mealPlan: StoredMealPlan & { id: string } }>,
            { userId: string }
        >,
        res: Response,
        next: NextFunction
    ) {
		try {

			const { sessionId } = req.params
			const { userId } = req.body

			const savedPlan =
				await this.service.confirmMealPlan(
					userId,
					sessionId
				)

            const response: BasicSuccessResponse<{ mealPlan: StoredMealPlan & { id: string } }> = {
                success: true,
                data: { mealPlan: savedPlan }
            }

			return res.json(response)

		} catch (error) {
			next(error)
		}
	}
}
