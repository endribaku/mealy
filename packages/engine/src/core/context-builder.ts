import { IDataAccess } from './data-access.js'
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
 * Errors
 */
export class UserNotFoundError extends Error {
  constructor(userId: string) {
    super(`User not found: ${userId}`)
    this.name = 'UserNotFoundError'
  }
}

export class SessionNotFoundError extends Error {
  constructor(sessionId: string) {
    super(`Session not found: ${sessionId}`)
    this.name = 'SessionNotFoundError'
  }
}

/**
 * Context Builder
 * Domain-aligned: No schema reshaping.
 */
export class ContextBuilder {
  private dataAccess: IDataAccess

  constructor(dataAccess: IDataAccess) {
    this.dataAccess = dataAccess
  }

  /**
   * Build Full Context
   * Directly returns domain User
   */
  async buildFullContext(
    userId: string,
    sessionId?: string
  ): Promise<FullContext> {

    const user = await this.dataAccess.findUserById(userId)

    if (!user) {
      throw new UserNotFoundError(userId)
    }

    const session = sessionId
      ? await this.buildSessionContext(sessionId)
      : null

    const estimatedTokens = this.estimateTokens(user, session)

    return {
      user,
      session,
      estimatedTokens,
    }
  }

  /**
   * Build Session Context
   */
  private async buildSessionContext(
    sessionId: string
  ): Promise<SessionContext> {

    const session =
      await this.dataAccess.findSessionById(sessionId)

    if (!session) {
      throw new SessionNotFoundError(sessionId)
    }

    return {
      currentMealPlan: session.currentMealPlan || null,
      modifications: session.modifications.map(mod => ({
        mealId: mod.mealId,
        action: mod.action,
        reason: mod.reason,
        timestamp: mod.timestamp,
      })),
      temporaryConstraints:
        session.temporaryConstraints || [],
    }
  }

  /**
   * Token Estimation (approximate)
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
   * Debug helper
   */
  toPromptString(context: FullContext): string {
    return JSON.stringify(context, null, 2)
  }
}
