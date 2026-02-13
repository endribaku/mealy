import { IDataAccess } from '@mealy/engine'
import { ContextBuilder } from '@mealy/engine'
import {
  MealPlanGenerator,
  GenerationOptions
} from '@mealy/engine'
import { MealPlan } from '@mealy/engine'

export class MealPlanService {

    private dataAccess: IDataAccess
    private contextBuilder: ContextBuilder
    private generator: MealPlanGenerator

    constructor(dataAccess: IDataAccess) {
        this.dataAccess = dataAccess
        this.contextBuilder = new ContextBuilder()
        this.generator = new MealPlanGenerator()
    }

    // ============================================================
    // GENERATE NEW PLAN
    // ============================================================

    async generateMealPlan(
        userId: string,
        options?: GenerationOptions
    ) {

        const user = await this.ensureUserExists(userId)

        // 🧠 Generate first (no DB writes yet)
        const tempContext = this.contextBuilder.buildFullContext(user, null)

        const result = await this.generator.generateMealPlan(
        tempContext,
        options
        )

        // 💾 Persist after success
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

        const { user, session } =
        await this.ensureSessionOwnership(userId, sessionId)

        const context = this.contextBuilder.buildFullContext(
        user,
        this.contextBuilder.buildSessionContext(session)
        )

        // 🧠 Generate first
        const result = await this.generator.regenerateSingleMeal(
        context,
        mealId,
        reason,
        options
        )

        // 💾 Atomic persistence
        await this.dataAccess.applySessionRegeneration(
        sessionId,
        result.mealPlan,
        {
            action: 'regenerate-meal',
            mealId,
            reason
        }
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

        const { user, session } =
        await this.ensureSessionOwnership(userId, sessionId)

        const context = this.contextBuilder.buildFullContext(
        user,
        this.contextBuilder.buildSessionContext(session)
        )

        const result = await this.generator.regenerateFullPlan(
        context,
        reason,
        options
        )

        await this.dataAccess.applySessionRegeneration(
        sessionId,
        result.mealPlan,
        {
            action: 'regenerate-all',
            reason
        }
        )

        return result.mealPlan
    }

    // ============================================================
    // CONFIRM PLAN
    // ============================================================

    async confirmMealPlan(userId: string, sessionId: string) {

        const { session } =
        await this.ensureSessionOwnership(userId, sessionId)

        if (!session.currentMealPlan) {
        throw new Error('No meal plan to confirm')
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

        const plan = await this.dataAccess.findMealPlanById(planId)

        if (!plan || plan.userId !== userId) {
        throw new Error('Meal plan not found')
        }

        await this.dataAccess.deleteMealPlan(planId)

        return true
    }

    // ============================================================
    // HISTORY
    // ============================================================

    async getMealPlanHistory(userId: string) {
        return this.dataAccess.findMealPlansByUserId(userId)
    }

    async getMealPlanById(userId: string, planId: string) {
        const plan = await this.dataAccess.findMealPlanById(planId)

        if (!plan || plan.userId !== userId) {
        throw new Error('Meal plan not found')
        }

        return plan
    }

    // ============================================================
    // PRIVATE HELPERS
    // ============================================================

    private async ensureUserExists(userId: string) {
        const user = await this.dataAccess.findUserById(userId)
        if (!user) throw new Error('User not found')
        return user
    }

    private async ensureSessionOwnership(userId: string, sessionId: string) {
        const user = await this.ensureUserExists(userId)

        const session = await this.dataAccess.findSessionById(sessionId)
        if (!session) throw new Error('Session not found')

        if (session.userId !== userId) {
        throw new Error('Unauthorized')
        }

        return { user, session }
    }
}
