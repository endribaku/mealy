import { ContextBuilder } from '../src/core/context-builder'
import { User } from '../src/core/schemas/user-schemas'
import { Session } from '../src/core/schemas/schemas'

/* ========================================================================== */
/*                               TEST FACTORIES                               */
/* ========================================================================== */

function baseUser(): User {
  return {
    id: crypto.randomUUID(),
    email: 'test@example.com',
    profile: {
      name: 'Test User',
      diet: 'omnivore',
      calorieTarget: 2000,
      cookingSkill: 'intermediate',
      householdSize: 2,
      measurementSystem: 'imperial',
      goals: [],
      preferences: undefined,
    },
    learnedPreferences: {
      dislikedIngredients: [],
      dislikedCuisines: [],
      dislikedMealTypes: [],
      favoriteCuisines: [],
      favoriteIngredients: [],
      favoriteMealTypes: [],
      spiceLevel: undefined,
      preferredComplexity: undefined,
      patterns: undefined,
    },
    dietaryRestrictions: undefined,
  }
}

function baseSession(userId: string): Session {
  return {
    id: crypto.randomUUID(),
    userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
    modifications: [],
    temporaryConstraints: [],
    status: 'active',
    currentMealPlan: undefined,
  }
}

/* ========================================================================== */
/*                              TEST SUITE                                    */
/* ========================================================================== */

describe('ContextBuilder (Pure Domain Version)', () => {

  let builder: ContextBuilder

  beforeEach(() => {
    builder = new ContextBuilder()
  })

  /* ======================================================================== */
  /*                           buildFullContext                               */
  /* ======================================================================== */

  describe('buildFullContext', () => {

    it('returns user directly', () => {
      const user = baseUser()

      const result = builder.buildFullContext(user, null)

      expect(result.user).toBe(user)
      expect(result.session).toBeNull()
      expect(result.estimatedTokens).toBeGreaterThan(0)
    })

    it('includes session when provided', () => {
      const user = baseUser()
      const session = baseSession(user.id)

      const sessionContext =
        builder.buildSessionContext(session)

      const result = builder.buildFullContext(
        user,
        sessionContext
      )

      expect(result.user).toBe(user)
      expect(result.session).toBeDefined()
      expect(result.session?.temporaryConstraints).toEqual([])
    })

    it('maps session modifications correctly', () => {
      const user = baseUser()
      const session = baseSession(user.id)

      session.modifications = [
        {
          action: 'regenerate-meal',
          mealId: 'd1',
          reason: 'Too spicy',
          timestamp: new Date().toISOString(),
        }
      ]

      const sessionContext =
        builder.buildSessionContext(session)

      const result = builder.buildFullContext(
        user,
        sessionContext
      )

      expect(result.session?.modifications).toHaveLength(1)
      expect(result.session?.modifications[0]?.mealId).toBe('d1')
    })

    it('returns null currentMealPlan if undefined', () => {
      const user = baseUser()
      const session = baseSession(user.id)

      const sessionContext =
        builder.buildSessionContext(session)

      const result = builder.buildFullContext(
        user,
        sessionContext
      )

      expect(result.session?.currentMealPlan).toBeNull()
    })

    it('estimates more tokens for larger user object', () => {
      const smallUser = baseUser()
      const largeUser = baseUser()

      largeUser.learnedPreferences.dislikedIngredients =
        Array(200).fill('ingredient')

      const smallContext =
        builder.buildFullContext(smallUser, null)

      const largeContext =
        builder.buildFullContext(largeUser, null)

      expect(largeContext.estimatedTokens)
        .toBeGreaterThan(smallContext.estimatedTokens)
    })
  })
})
