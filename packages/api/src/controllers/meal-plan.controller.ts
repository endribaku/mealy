import { Request, Response, NextFunction } from 'express'
import { MealPlanService } from '../services/meal-plan.service'
import { GenerationOptions, MealPlan, StoredMealPlan } from '@mealy/engine'
import { logger } from '../misc/logger'
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

		logger.info({
		event: 'meal_plan_generate_requested',
		userId
		})

		const result = await this.service.generateMealPlan(
		userId,
		options
		)

		logger.info({
		event: 'meal_plan_generate_success',
		userId
		})

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
	// POST /api/users/:userId/sessions/:sessionId/regenerate-meal
	// ============================================================

	async regenerateSingle(
		req: Request<
			{ userId: string; sessionId: string },
			BasicSuccessResponse<{ mealPlan: MealPlan }>,
			{
				mealId: string
				reason: string
				options?: GenerationOptions
			}
		>,
		res: Response,
		next: NextFunction
	) {
		try {

			const { userId, sessionId } = req.params
			const { mealId, reason, options } = req.body

			logger.info({
			event: 'meal_regenerate_single_requested',
			userId,
			sessionId,
			mealId
			})

			const mealPlan = await this.service.regenerateSingleMeal(
				userId,
				sessionId,
				mealId,
				reason,
				options
			)

			logger.info({
			event: 'meal_regenerate_single_success',
			userId,
			sessionId,
			mealId
			})

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
	// POST /api/users/:userId/sessions/:sessionId/regenerate
	// ============================================================

	async regenerateFull(
		req: Request<
			{ userId: string; sessionId: string },
			BasicSuccessResponse<{ mealPlan: MealPlan }>,
			{
				reason: string
				options?: GenerationOptions
			}
		>,
		res: Response,
		next: NextFunction
	) {
		try {

			const { userId, sessionId } = req.params
			const { reason, options } = req.body
			
			logger.info({
				event: 'meal_plan_regenerate_full_requested',
				userId,
				sessionId,
				reason
			})

			const mealPlan = await this.service.regenerateFullPlan(
				userId,
				sessionId,
				reason,
				options
			)

			logger.info({
				event: 'meal_plan_regenerate_full_success',
				userId,
				sessionId
			})

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
	// POST /api/users/:userId/sessions/:sessionId/confirm
	// ============================================================

	async confirm(
		req: Request<
			{ userId: string; sessionId: string },
			BasicSuccessResponse<{ mealPlan: StoredMealPlan & { id: string } }>
		>,
		res: Response,
		next: NextFunction
	) {
		try {

			const { userId, sessionId } = req.params

			logger.info({
				event: 'meal_plan_confirm_requested',
				userId,
				sessionId
			})

			const savedPlan = await this.service.confirmMealPlan(
				userId,
				sessionId
			)

			logger.info({
				event: 'meal_plan_confirm_success',
				userId,
				sessionId
			})

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

			logger.info({
				event: 'meal_plan_delete_requested',
				userId,
				planId
			})

			await this.service.deleteMealPlan(
				userId,
				planId
			)

			logger.info({
				event: 'meal_plan_delete_success',
				userId,
				planId
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
