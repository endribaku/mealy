import { Request, Response, NextFunction } from 'express'
import { MealPlanService } from '../services/meal-plan.service'
import { GenerationOptions, MealPlan, StoredMealPlan } from '@mealy/engine'

import {
	GenerateMealPlanResponse,
	BasicSuccessResponse
} from '../types/dto.types'

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

			const result = await this.service.generateMealPlan(
				userId,
				options
			)

			return res.status(201).json({
				success: true,
				data: result
			})

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

			const mealPlan = await this.service.regenerateSingleMeal(
				userId,
				sessionId,
				mealId,
				reason,
				options
			)

			return res.json({
				success: true,
				data: { mealPlan }
			})

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

			const mealPlan = await this.service.regenerateFullPlan(
				userId,
				sessionId,
				reason,
				options
			)

			return res.json({
				success: true,
				data: { mealPlan }
			})

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

			const savedPlan = await this.service.confirmMealPlan(
				userId,
				sessionId
			)

			return res.json({
				success: true,
				data: { mealPlan: savedPlan }
			})

		} catch (error) {
			next(error)
		}
	}

    // ============================================================
	// GET MEAL PLAN HISTORY
	// GET /api/users/:userId/meal-plans
	// ============================================================

	async getAll(
		req: Request<
			{ userId: string },
			BasicSuccessResponse<StoredMealPlan[]>
		>,
		res: Response,
		next: NextFunction
	) {
		try {

			const { userId } = req.params

			const plans = await this.service.getMealPlanHistory(userId)

			return res.json({
				success: true,
				data: plans
			})

		} catch (error) {
			next(error)
		}
	}

	// ============================================================
	// GET SINGLE MEAL PLAN
	// GET /api/users/:userId/meal-plans/:planId
	// ============================================================

	async getById(
		req: Request<
			{ userId: string; planId: string },
			BasicSuccessResponse<StoredMealPlan>
		>,
		res: Response,
		next: NextFunction
	) {
		try {

			const { userId, planId } = req.params

			const plan = await this.service.getMealPlanById(
				userId,
				planId
			)

			return res.json({
				success: true,
				data: plan
			})

		} catch (error) {
			next(error)
		}
	}

	// ============================================================
	// DELETE MEAL PLAN
	// DELETE /api/users/:userId/meal-plans/:planId
	// ============================================================

	async delete(
		req: Request<
			{ userId: string; planId: string },
			BasicSuccessResponse<{ deleted: true }>
		>,
		res: Response,
		next: NextFunction
	) {
		try {

			const { userId, planId } = req.params

			await this.service.deleteMealPlan(
				userId,
				planId
			)

			return res.json({
				success: true,
				data: { deleted: true }
			})

		} catch (error) {
			next(error)
		}
	}
}
