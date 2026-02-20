import { MealPlanService } from '../../../../src/services/meal-plan.service'
import { IDataAccess, IContextBuilder, IMealPlanGenerator } from '@mealy/engine'
import { HttpError } from '../../../../src/errors/http-error'

describe('MealPlanService', () => {

  let mockDataAccess: jest.Mocked<IDataAccess>
  let mockContextBuilder: jest.Mocked<IContextBuilder>
  let mockGenerator: jest.Mocked<IMealPlanGenerator>
  let service: MealPlanService

  const fakeUser = { id: 'u1' } as any
  const fakeSession = { id: 's1', userId: 'u1' } as any
  const fakeMealPlan = { days: [] } as any
  const fakeContext = {} as any

  beforeEach(() => {

    mockDataAccess = {
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
      applySessionRegeneration: jest.fn()
    } as any

    mockContextBuilder = {
      buildFullContext: jest.fn(),
      buildSessionContext: jest.fn(),
      toPromptString: jest.fn()
    }

    mockGenerator = {
      generateMealPlan: jest.fn(),
      regenerateSingleMeal: jest.fn(),
      regenerateFullPlan: jest.fn()
    }

    service = new MealPlanService(
      mockDataAccess,
      mockContextBuilder,
      mockGenerator
    )
  })

  // ============================================================
  // GENERATE
  // ============================================================

  describe('generateMealPlan', () => {

    it('throws if user does not exist', async () => {
      mockDataAccess.findUserById.mockResolvedValue(null)

      await expect(
        service.generateMealPlan('u1')
      ).rejects.toThrow('User not found')

      expect(mockGenerator.generateMealPlan).not.toHaveBeenCalled()
    })

    it('generates successfully (happy path)', async () => {

      mockDataAccess.findUserById.mockResolvedValue(fakeUser)
      mockContextBuilder.buildFullContext.mockReturnValue(fakeContext)

      mockGenerator.generateMealPlan.mockResolvedValue({
        mealPlan: fakeMealPlan,
        tokensUsed: { totalTokens: 100 },
        generationTime: 200,
        provider: 'openai'
      } as any)

      mockDataAccess.createSession.mockResolvedValue(fakeSession)

      const updatedSession = {
        ...fakeSession,
        currentMealPlan: fakeMealPlan
      }

      mockDataAccess.updateSessionMealPlan.mockResolvedValue(updatedSession)
      mockDataAccess.findSessionById.mockResolvedValue(updatedSession)

      const result = await service.generateMealPlan('u1')

      expect(result.session).toEqual(updatedSession)
      expect(result.metadata.tokensUsed).toBe(100)

      expect(mockDataAccess.updateSessionMealPlan)
        .toHaveBeenCalledWith('s1', fakeMealPlan)
    })
  })

  // ============================================================
  // REGENERATE SINGLE
  // ============================================================

  // ============================================================
  // REGENERATE SINGLE
  // ============================================================

  describe('regenerateSingleMeal', () => {

    it('throws if user not found', async () => {
      mockDataAccess.findUserById.mockResolvedValue(null)

      await expect(
        service.regenerateSingleMeal('u1', 's1', 'm1', 'reason')
      ).rejects.toThrow('User not found')
    })

    it('throws if session does not exist', async () => {
      mockDataAccess.findUserById.mockResolvedValue(fakeUser)
      mockDataAccess.findSessionById.mockResolvedValue(null)

      await expect(
        service.regenerateSingleMeal('u1', 's1', 'm1', 'reason')
      ).rejects.toThrow('Session not found')
    })

    it('throws Unauthorized if session belongs to another user', async () => {
      mockDataAccess.findUserById.mockResolvedValue(fakeUser)
      mockDataAccess.findSessionById.mockResolvedValue({
        id: 's1',
        userId: 'other'
      } as any)

      await expect(
        service.regenerateSingleMeal('u1', 's1', 'm1', 'reason')
      ).rejects.toThrow('Unauthorized')
    })

    it('regenerates successfully', async () => {

      const updatedSession = {
        ...fakeSession,
        currentMealPlan: fakeMealPlan
      }

      mockDataAccess.findUserById.mockResolvedValue(fakeUser)

      // 🔥 IMPORTANT FIX: sequential mock values
      mockDataAccess.findSessionById
        .mockResolvedValueOnce(fakeSession)      // first call (ensureSessionExists)
        .mockResolvedValueOnce(updatedSession)   // second call (after update)

      mockContextBuilder.buildSessionContext.mockReturnValue({} as any)
      mockContextBuilder.buildFullContext.mockReturnValue(fakeContext)

      mockGenerator.regenerateSingleMeal.mockResolvedValue({
        mealPlan: fakeMealPlan,
        tokensUsed: { totalTokens: 50 },
        generationTime: 100
      } as any)

      mockDataAccess.addSessionModification.mockResolvedValue(updatedSession)
      mockDataAccess.updateSessionMealPlan.mockResolvedValue(updatedSession)

      const result = await service.regenerateSingleMeal(
        'u1',
        's1',
        'm1',
        'reason'
      )

      expect(result).toEqual(updatedSession)

      expect(mockDataAccess.addSessionModification).toHaveBeenCalled()
      expect(mockDataAccess.updateSessionMealPlan)
        .toHaveBeenCalledWith('s1', fakeMealPlan)
    })
  })


  // ============================================================
  // REGENERATE FULL
  // ============================================================

  describe('regenerateFullPlan', () => {

    it('throws if session does not exist', async () => {
      mockDataAccess.findUserById.mockResolvedValue(fakeUser)
      mockDataAccess.findSessionById.mockResolvedValue(null)

      await expect(
        service.regenerateFullPlan('u1', 's1', 'reason')
      ).rejects.toThrow('Session not found')
    })

    it('throws if session belongs to another user', async () => {
      mockDataAccess.findUserById.mockResolvedValue(fakeUser)
      mockDataAccess.findSessionById.mockResolvedValue({
        id: 's1',
        userId: 'other'
      } as any)

      await expect(
        service.regenerateFullPlan('u1', 's1', 'reason')
      ).rejects.toThrow('Session not found')
    })

    it('regenerates full plan successfully', async () => {

      mockDataAccess.findUserById.mockResolvedValue(fakeUser)
      mockDataAccess.findSessionById.mockResolvedValue(fakeSession)

      mockContextBuilder.buildSessionContext.mockReturnValue({} as any)
      mockContextBuilder.buildFullContext.mockReturnValue(fakeContext)

      mockGenerator.regenerateFullPlan.mockResolvedValue({
        mealPlan: fakeMealPlan,
        tokensUsed: { totalTokens: 80 },
        generationTime: 120
      } as any)

      const updatedSession = {
        ...fakeSession,
        currentMealPlan: fakeMealPlan
      }

      mockDataAccess.updateSessionMealPlan.mockResolvedValue(updatedSession)
      mockDataAccess.findSessionById.mockResolvedValue(updatedSession)

      const result = await service.regenerateFullPlan(
        'u1',
        's1',
        'reason'
      )

      expect(result).toEqual(updatedSession)
      expect(mockDataAccess.updateSessionMealPlan)
        .toHaveBeenCalledWith('s1', fakeMealPlan)
    })
  })

  // ============================================================
  // CONFIRM
  // ============================================================

  describe('confirmMealPlan', () => {

    it('throws if no meal plan to confirm', async () => {
      mockDataAccess.findSessionById.mockResolvedValue({
        id: 's1',
        userId: 'u1',
        currentMealPlan: null
      } as any)

      await expect(
        service.confirmMealPlan('u1', 's1')
      ).rejects.toThrow('No meal plan to confirm')
    })

    it('confirms successfully', async () => {

      const sessionWithPlan = {
        id: 's1',
        userId: 'u1',
        currentMealPlan: fakeMealPlan
      }

      const confirmedSession = {
        ...sessionWithPlan,
        status: 'confirmed'
      }

      // 🔥 Sequential mock for two calls
      mockDataAccess.findSessionById
        .mockResolvedValueOnce(sessionWithPlan as any)  // ensureSessionOwnership
        .mockResolvedValueOnce(confirmedSession as any) // final reload

      mockDataAccess.saveMealPlan.mockResolvedValue({
        ...fakeMealPlan,
        id: 'p1'
      } as any)

      mockDataAccess.updateSessionStatus = jest
        .fn()
        .mockResolvedValue(confirmedSession)

      const result = await service.confirmMealPlan('u1', 's1')

      expect(mockDataAccess.saveMealPlan)
        .toHaveBeenCalledWith('u1', fakeMealPlan)

      expect(mockDataAccess.updateSessionStatus)
        .toHaveBeenCalledWith('s1', 'confirmed')

      expect(result).toEqual(confirmedSession)
    })







  // ============================================================
  // DELETE PLAN
  // ============================================================

  describe('deleteMealPlan', () => {

    it('throws if plan does not exist', async () => {
      mockDataAccess.findMealPlanById.mockResolvedValue(null)

      await expect(
        service.deleteMealPlan('u1', 'p1')
      ).rejects.toThrow('Meal plan not found')
    })

    it('throws if plan belongs to another user', async () => {
      mockDataAccess.findMealPlanById.mockResolvedValue({
        id: 'p1',
        userId: 'other'
      } as any)

      await expect(
        service.deleteMealPlan('u1', 'p1')
      ).rejects.toThrow('Meal plan not found')
    })

    it('deletes successfully', async () => {
      mockDataAccess.findMealPlanById.mockResolvedValue({
        id: 'p1',
        userId: 'u1'
      } as any)

      const result = await service.deleteMealPlan('u1', 'p1')

      expect(mockDataAccess.deleteMealPlan).toHaveBeenCalledWith('p1')
      expect(result).toBe(true)
    })
  })

  // ============================================================
  // HISTORY
  // ============================================================

  describe('getMealPlanHistory', () => {

    it('throws if user does not exist', async () => {
      mockDataAccess.findUserById.mockResolvedValue(null)

      await expect(
        service.getMealPlanHistory('u1')
      ).rejects.toThrow('User not found')
    })

    it('returns history', async () => {
      mockDataAccess.findUserById.mockResolvedValue(fakeUser)
      mockDataAccess.findMealPlansByUserId.mockResolvedValue([])

      const result = await service.getMealPlanHistory('u1')

      expect(result).toEqual([])
    })
  })
  })
})
