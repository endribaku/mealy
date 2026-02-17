import { User } from '../schemas/user-schemas.js'
import {
  FullContext,
  SessionContext
} from '../context-builder.js'

export interface IContextBuilder {

  buildFullContext(
    user: User,
    session: SessionContext | null
  ): FullContext

  buildSessionContext(session: {
    currentMealPlan?: any
    modifications?: Array<{
      mealId?: string
      action: string
      reason: string
      timestamp: string
    }>
    temporaryConstraints?: string[]
  }): SessionContext

  toPromptString(context: FullContext): string
}
