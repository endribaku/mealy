import {
  ContextBuilder,
  UserNotFoundError,
  SessionNotFoundError,
} from '../src/core/context-builder'

import { IDataAccess } from '../src/core/data-access'
import { User } from '../src/core/schemas/user-schemas'
import { Session } from '../src/core/schemas/schemas'

/* ========================================================================== */
/*                               TEST FACTORIES                               */
/* ========================================================================== */

function createMockDataAccess(): jest.Mocked<IDataAccess> {
  return {
    findUserById: jest.fn(),
    findUserByEmail: jest.fn(),
    createUser: jest.fn(),
    updateUserProfile: jest.fn(),
    updateLearnedPreferences: jest.fn(),
    updateDietaryRestrictions: jest.fn(),
    deleteUser: jest.fn(),

    findSessionById: jest.fn(),
    findSessionsByUserId: jest.fn(),
    createSession: jest.fn(),
    updateSessionMealPlan: jest.fn(),
    addSessionModification: jest.fn(),
    addSessionConstraint: jest.fn(),
    deleteSession: jest.fn(),
    expireOldSessions: jest.fn(),

    saveMealPlan: jest.fn(),
    findMealPlanById: jest.fn(),
    findMealPlansByUserId: jest.fn(),
    deleteMealPlan: jest.fn(),
  }
}

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

describe('ContextBuilder (Domain-Aligned)', () => {
  let dataAccess: jest.Mocked<IDataAccess>
  let builder: ContextBuilder

  beforeEach(() => {
    dataAccess = createMockDataAccess()
    builder = new ContextBuilder(dataAccess)
  })

  /* ======================================================================== */
  /*                           buildFullContext                                */
  /* ======================================================================== */

  describe('buildFullContext', () => {

    it('returns user directly from data layer', async () => {
      const user = baseUser()
      dataAccess.findUserById.mockResolvedValue(user)

      const result = await builder.buildFullContext(user.id)

      expect(result.user).toBe(user)
      expect(result.session).toBeNull()
      expect(result.estimatedTokens).toBeGreaterThan(0)
    })

    it('includes session when provided', async () => {
      const user = baseUser()
      const session = baseSession(user.id)

      dataAccess.findUserById.mockResolvedValue(user)
      dataAccess.findSessionById.mockResolvedValue(session)

      const result = await builder.buildFullContext(
        user.id,
        session.id
      )

      expect(result.user).toBe(user)
      expect(result.session).toBeDefined()
      expect(result.session?.temporaryConstraints).toEqual([])
    })

    it('maps session modifications correctly', async () => {
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

      dataAccess.findUserById.mockResolvedValue(user)
      dataAccess.findSessionById.mockResolvedValue(session)

      const result = await builder.buildFullContext(
        user.id,
        session.id
      )

      expect(result.session?.modifications).toHaveLength(1)
      expect(result.session?.modifications[0]?.mealId).toBe('d1')
    })

    it('returns null currentMealPlan if undefined', async () => {
      const user = baseUser()
      const session = baseSession(user.id)

      dataAccess.findUserById.mockResolvedValue(user)
      dataAccess.findSessionById.mockResolvedValue(session)

      const result = await builder.buildFullContext(
        user.id,
        session.id
      )

      expect(result.session?.currentMealPlan).toBeNull()
    })

    it('estimates more tokens for larger user object', async () => {
      const smallUser = baseUser()
      const largeUser = baseUser()
      largeUser.learnedPreferences.dislikedIngredients =
        Array(200).fill('ingredient')

      dataAccess.findUserById.mockResolvedValue(smallUser)
      const smallContext =
        await builder.buildFullContext(smallUser.id)

      dataAccess.findUserById.mockResolvedValue(largeUser)
      const largeContext =
        await builder.buildFullContext(largeUser.id)

      expect(largeContext.estimatedTokens)
        .toBeGreaterThan(smallContext.estimatedTokens)
    })

    it('throws UserNotFoundError when user missing', async () => {
      dataAccess.findUserById.mockResolvedValue(null)

      await expect(
        builder.buildFullContext('invalid')
      ).rejects.toThrow(UserNotFoundError)
    })

    it('throws SessionNotFoundError when session missing', async () => {
      const user = baseUser()

      dataAccess.findUserById.mockResolvedValue(user)
      dataAccess.findSessionById.mockResolvedValue(null)

      await expect(
        builder.buildFullContext(user.id, 'invalid')
      ).rejects.toThrow(SessionNotFoundError)
    })
  })
})
