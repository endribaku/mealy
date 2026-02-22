import { IDataAccess, MealPlan, Meal, computeLearnedPreferences } from '@mealy/engine'
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


	private findMealInPlan(mealPlan: MealPlan | undefined, mealId: string): Meal | null {
		if (!mealPlan) return null
		// mealId format from mobile: "day-{dayNumber}-{mealType}"
		const match = mealId.match(/^day-(\d+)-(.+)$/)
		if (!match) return null
		const dayNumber = parseInt(match[1], 10)
		const mealType = match[2] as 'breakfast' | 'lunch' | 'dinner'
		const day = mealPlan.days.find(d => d.dayNumber === dayNumber)
		if (!day || !day.meals[mealType]) return null
		return day.meals[mealType]
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

	async generateMealPlan(userId: string, options?: GenerationOptions) {

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

		const updatedSession = await this.dataAccess.findSessionById(session.id)

		return {
			session: updatedSession,
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
        const rejectedMeal = this.findMealInPlan(session.currentMealPlan, mealId)

        await this.dataAccess.addSessionModification(sessionId, {
            action: 'regenerate-meal',
            mealId,
            reason,
            rejectedMeal: rejectedMeal ?? undefined
        })

		await this.dataAccess.updateSessionMealPlan(
			sessionId,
			result.mealPlan
		)

		const updatedSession = await this.dataAccess.findSessionById(sessionId)

		return updatedSession
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

		// Ensure ownership AND get session
		const session = await this.ensureSessionOwnership(userId, sessionId)

		// Build context from CURRENT session
		const context = this.contextBuilder.buildFullContext(
			user,
			this.contextBuilder.buildSessionContext(session)
		)

		// 🧠 Call AI FIRST (no DB writes yet)
		const result = await this.generator.regenerateFullPlan(
			context,
			reason,
			options
		)

		// 💾 Persist only after success

		await this.dataAccess.updateSessionMealPlan(
			sessionId,
			result.mealPlan
		)

		await this.dataAccess.addSessionModification(sessionId, {
			action: 'regenerate-all',
			reason
		})

		// Fetch fresh updated session
		const updatedSession = await this.dataAccess.findSessionById(sessionId)

		return updatedSession
	}


	// ============================================================
	// CONFIRM PLAN
	// ============================================================

	async confirmMealPlan(userId: string, sessionId: string, startDate?: string, replaceConflicting?: boolean) {

		const session = await this.ensureSessionOwnership(userId, sessionId)

		if (!session.currentMealPlan) {
			throw new HttpError('No meal plan to confirm', 400)
		}

		if (startDate) {
			const numberOfDays = session.currentMealPlan.days.length
			const end = new Date(startDate)
			end.setDate(end.getDate() + numberOfDays - 1)
			const endDateStr = end.toISOString().split('T')[0]

			const hasOverlap = await this.dataAccess.hasOverlappingMealPlan(
				userId,
				startDate,
				endDateStr
			)

			if (hasOverlap) {
				if (!replaceConflicting) {
					throw new HttpError(
						'Date range overlaps with an existing meal plan. Choose different dates.',
						409
					)
				}

				const overlapping = await this.dataAccess.findMealPlansByDateRange(userId, startDate, endDateStr)
				for (const plan of overlapping) {
					await this.dataAccess.deleteMealPlan(plan.id)
				}
			}
		}

		await this.dataAccess.saveMealPlan(
			userId,
			session.currentMealPlan,
			startDate
		)

		await this.dataAccess.updateSessionStatus(
			sessionId,
			'confirmed'
		)

		const confirmedSession = await this.dataAccess.findSessionById(sessionId)

		// Non-blocking: trigger preference learning in the background
		this.runPreferenceLearning(userId).catch(() => {})

		return confirmedSession
	}

	private async runPreferenceLearning(userId: string): Promise<void> {
		const confirmedPlans = await this.dataAccess.findMealPlansByUserId(userId)
		const allSessions = await this.dataAccess.findSessionsByUserId(userId)
		const confirmedSessions = allSessions.filter(s => s.status === 'confirmed')

		const result = computeLearnedPreferences({ confirmedPlans, confirmedSessions })

		if (result.shouldUpdate && result.preferences) {
			await this.dataAccess.updateLearnedPreferences(userId, result.preferences)
		}
	}

	// ============================================================
	// CALENDAR
	// ============================================================

	async getMealPlansForCalendar(userId: string, fromDate: string, toDate: string) {
		await this.ensureUserExists(userId)
		return this.dataAccess.findMealPlansByDateRange(userId, fromDate, toDate)
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
