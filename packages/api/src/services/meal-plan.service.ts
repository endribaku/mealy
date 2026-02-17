import { IDataAccess, MealPlan } from '@mealy/engine'
import { ContextBuilder, MealPlanGenerator, GenerationOptions, IContextBuilder, IMealPlanGenerator } from '@mealy/engine'
import { HttpError } from '../errors/http-error'
import { SessionService } from './session.service'

export class MealPlanService {

	constructor(
    private readonly dataAccess: IDataAccess,
    private readonly contextBuilder: IContextBuilder,
    private readonly generator: IMealPlanGenerator
    ) {}


    

	// ============================================================
	// INTERNAL GUARDS
	// ============================================================

	private async ensureUserExists(userId: string) {

		const user = await this.dataAccess.findUserById(userId)

		if (!user) {
			throw new HttpError('User not found', 404)
		}

		return user
	}

	private async ensureSessionOwnership(userId: string, sessionId: string) {

		const session = await this.dataAccess.findSessionById(sessionId)

		if (!session || session.userId !== userId) {
			throw new HttpError('Session not found', 404)
		}

		return session
	}

    private async ensureSessionExists(sessionId: string) {

        const session = await this.dataAccess.findSessionById(sessionId)

        if (!session) {
            throw new HttpError('Session not found', 404)
        }

        return session
    }


	private async ensureMealPlanOwnership(userId: string, planId: string) {

		const plan = await this.dataAccess.findMealPlanById(planId)

		if (!plan || plan.userId !== userId) {
			throw new HttpError('Meal plan not found', 404)
		}

		return plan
	}

	// ============================================================
	// GENERATE NEW PLAN
	// ============================================================

	async generateMealPlan(
		userId: string,
		options?: GenerationOptions
	) {

		const user = await this.ensureUserExists(userId)

		const context = this.contextBuilder.buildFullContext(user, null)

		const result = await this.generator.generateMealPlan(
			context,
			options
		)

		const session = await this.dataAccess.createSession(userId)

		await this.dataAccess.updateSessionMealPlan(
			session.id,
			result.mealPlan
		)

		return {
			sessionId: session.id,
			mealPlan: result.mealPlan,
			metadata: {
				tokensUsed: result.tokensUsed.totalTokens,
				generationTime: result.generationTime
			}
		}
	}

	// ============================================================
	// REGENERATE SINGLE MEAL
	// ============================================================

	async regenerateSingleMeal(
        userId: string,
        sessionId: string,
        mealId: string,
        reason: string,
        options?: GenerationOptions
    ) {

        const user = await this.ensureUserExists(userId)

        const session = await this.ensureSessionExists(sessionId)

        if (session.userId !== userId) {
            throw new HttpError('Unauthorized', 403)
        }

        // 🧠 Build context from CURRENT session (no DB writes yet)
        const context = this.contextBuilder.buildFullContext(
            user,
            this.contextBuilder.buildSessionContext(session)
        )

        // 🧠 AI first
        const result = await this.generator.regenerateSingleMeal(
            context,
            mealId,
            reason,
            options
        )

        // 💾 Only after AI success → persist mutation

        await this.dataAccess.addSessionModification(sessionId, {
            action: 'regenerate-meal',
            mealId,
            reason
        })

        await this.dataAccess.updateSessionMealPlan(
            sessionId,
            result.mealPlan
        )

        return result.mealPlan
    }


	// ============================================================
	// REGENERATE FULL PLAN
	// ============================================================

	async regenerateFullPlan(
		userId: string,
		sessionId: string,
		reason: string,
		options?: GenerationOptions
	) {

		const user = await this.ensureUserExists(userId)

		await this.ensureSessionOwnership(userId, sessionId)

		await this.dataAccess.addSessionModification(sessionId, {
			action: 'regenerate-all',
			reason
		})

		const updatedSession = await this.dataAccess.findSessionById(sessionId)

		const context = this.contextBuilder.buildFullContext(
			user,
			this.contextBuilder.buildSessionContext(updatedSession!)
		)

		const result = await this.generator.regenerateFullPlan(
			context,
			reason,
			options
		)

		await this.dataAccess.updateSessionMealPlan(
			sessionId,
			result.mealPlan
		)

		return result.mealPlan
	}

	// ============================================================
	// CONFIRM PLAN
	// ============================================================

	async confirmMealPlan(userId: string, sessionId: string) {

		const session = await this.ensureSessionOwnership(userId, sessionId)

		if (!session.currentMealPlan) {
			throw new HttpError('No meal plan to confirm', 400)
		}

		return this.dataAccess.saveMealPlan(
			userId,
			session.currentMealPlan
		)
	}

	// ============================================================
	// DELETE PLAN
	// ============================================================

	async deleteMealPlan(userId: string, planId: string) {

		await this.ensureMealPlanOwnership(userId, planId)

		await this.dataAccess.deleteMealPlan(planId)

		return true
	}

	// ============================================================
	// HISTORY
	// ============================================================

	async getMealPlanHistory(userId: string) {
		await this.ensureUserExists(userId)
		return this.dataAccess.findMealPlansByUserId(userId)
	}

	async getMealPlanById(userId: string, planId: string) {
		return this.ensureMealPlanOwnership(userId, planId)
	}
}
