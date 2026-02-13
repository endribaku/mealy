import { User } from '../core/schemas/user-schemas.js'

/**
 * Session Context (AI-relevant only)
 */
export interface SessionContext {
  currentMealPlan: any | null
  modifications: Array<{
    mealId?: string
    action: string
    reason: string
    timestamp: string
  }>
  temporaryConstraints: string[]
}

/**
 * Full Context passed to PromptBuilder
 * Uses DOMAIN User directly (no duplication)
 */
export interface FullContext {
  user: User
  session: SessionContext | null
  estimatedTokens: number
}

/**
 * Context Builder
 * Pure domain logic — no database access.
 */
export class ContextBuilder {

  /**
   * Build Full Context
   * Receives fully prepared domain objects.
   */
  buildFullContext(
    user: User,
    session: SessionContext | null
  ): FullContext {

    const estimatedTokens = this.estimateTokens(user, session)

    return {
      user,
      session,
      estimatedTokens,
    }
  }

  /**
   * Transform raw session domain object into AI-relevant SessionContext.
   * This keeps PromptBuilder isolated from full domain schema.
   */
  buildSessionContext(session: {
    currentMealPlan?: any
    modifications?: Array<{
      mealId?: string
      action: string
      reason: string
      timestamp: string
    }>
    temporaryConstraints?: string[]
  }): SessionContext {

    return {
      currentMealPlan: session.currentMealPlan ?? null,
      modifications: (session.modifications ?? []).map(mod => ({
        mealId: mod.mealId,
        action: mod.action,
        reason: mod.reason,
        timestamp: mod.timestamp,
      })),
      temporaryConstraints: session.temporaryConstraints ?? [],
    }
  }

  /**
   * Token Estimation (very approximate)
   * Rough heuristic: ~4 characters per token.
   */
  private estimateTokens(
    user: User,
    session: SessionContext | null
  ): number {
    const jsonStr = JSON.stringify({
      user,
      session,
    })

    return Math.ceil(jsonStr.length / 4)
  }

  /**
   * Debug helper (optional)
   */
  toPromptString(context: FullContext): string {
    return JSON.stringify(context, null, 2)
  }
}
