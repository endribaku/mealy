import request from 'supertest'
import { createIntegrationApp } from '../utils/create-integration-app'
import { API_PREFIX, ROUTE_SEGMENTS } from '../../../src/routes/routes.constants'

import {
  IDataAccess,
  IContextBuilder,
  IMealPlanGenerator
} from '@mealy/engine'

describe('Preference learning after confirm (Integration)', () => {

  let app: any
  let mockDataAccess: jest.Mocked<IDataAccess>
  let mockContextBuilder: jest.Mocked<IContextBuilder>
  let mockGenerator: jest.Mocked<IMealPlanGenerator>

  const validUserId = '550e8400-e29b-41d4-a716-446655440000'
  const validSessionId = '8f14e45f-ea4e-4cde-b123-123456789abc'
  const validPlanId = '9f14e45f-ea4e-4cde-b123-123456789abc'

  const fakeMealPlan = {
    days: [{
      dayNumber: 1,
      meals: {
        breakfast: {
          name: 'Oatmeal', cuisine: 'American',
          ingredients: [{ name: 'Oats', amount: 100, unit: 'g' }],
          nutrition: { calories: 300, protein: 10, carbs: 50, fat: 5 },
          instructions: ['Cook oats'], prepTime: 10,
          spiceLevel: 'none', complexity: 'simple',
        },
        lunch: {
          name: 'Salad', cuisine: 'American',
          ingredients: [{ name: 'Lettuce', amount: 200, unit: 'g' }],
          nutrition: { calories: 200, protein: 5, carbs: 20, fat: 10 },
          instructions: ['Mix greens'], prepTime: 5,
          spiceLevel: 'none', complexity: 'very-simple',
        },
        dinner: {
          name: 'Pasta', cuisine: 'Italian',
          ingredients: [{ name: 'Pasta', amount: 200, unit: 'g' }],
          nutrition: { calories: 600, protein: 20, carbs: 80, fat: 15 },
          instructions: ['Boil pasta'], prepTime: 20,
          spiceLevel: 'none', complexity: 'simple',
        },
      },
    }],
    nutritionSummary: { avgDailyCalories: 1100, avgProtein: 35 },
  }

  const fakeSessionWithPlan = {
    id: validSessionId,
    userId: validUserId,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    expiresAt: '2026-01-02T00:00:00Z',
    currentMealPlan: fakeMealPlan,
    modifications: [],
    temporaryConstraints: [],
    status: 'active' as const,
  }

  const endpoint = (sessionId: string) =>
    `${API_PREFIX}/${ROUTE_SEGMENTS.MEAL_PLANS}/${ROUTE_SEGMENTS.SESSIONS}/${sessionId}/${ROUTE_SEGMENTS.CONFIRM}`

  function makeStoredPlan(id: string) {
    return {
      id,
      userId: validUserId,
      mealPlan: fakeMealPlan,
      createdAt: '2026-01-01T00:00:00Z',
      status: 'active' as const,
    }
  }

  beforeEach(() => {
    mockDataAccess = {
      findUserById: jest.fn(),
      findSessionById: jest.fn(),
      saveMealPlan: jest.fn(),
      updateSessionStatus: jest.fn(),
      hasOverlappingMealPlan: jest.fn(),
      findMealPlansByUserId: jest.fn(),
      findSessionsByUserId: jest.fn(),
      updateLearnedPreferences: jest.fn(),
    } as any

    mockContextBuilder = {} as any
    mockGenerator = {} as any

    app = createIntegrationApp({
      dataAccess: mockDataAccess,
      contextBuilder: mockContextBuilder,
      generator: mockGenerator,
      testUser: { id: validUserId },
    })
  })

  it('triggers learning and calls updateLearnedPreferences when threshold is met', async () => {
    const confirmedSession = { ...fakeSessionWithPlan, status: 'confirmed' as const }

    mockDataAccess.findSessionById
      .mockResolvedValueOnce(fakeSessionWithPlan) // ensureSessionOwnership
      .mockResolvedValueOnce(confirmedSession)    // return after confirm

    mockDataAccess.saveMealPlan.mockResolvedValue({ ...makeStoredPlan(validPlanId), id: validPlanId })
    mockDataAccess.updateSessionStatus.mockResolvedValue(confirmedSession as any)

    // Learning data: 3 stored plans (meets threshold)
    mockDataAccess.findMealPlansByUserId.mockResolvedValue([
      makeStoredPlan('p1'),
      makeStoredPlan('p2'),
      makeStoredPlan('p3'),
    ])
    mockDataAccess.findSessionsByUserId.mockResolvedValue([
      { ...confirmedSession, id: 's1' },
      { ...confirmedSession, id: 's2' },
      { ...confirmedSession, id: 's3' },
    ])
    mockDataAccess.updateLearnedPreferences.mockResolvedValue({} as any)

    const res = await request(app)
      .post(endpoint(validSessionId))
      .send({})

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)

    // Wait for the non-blocking learning promise to resolve
    await new Promise(resolve => setImmediate(resolve))

    expect(mockDataAccess.findMealPlansByUserId).toHaveBeenCalledWith(validUserId)
    expect(mockDataAccess.findSessionsByUserId).toHaveBeenCalledWith(validUserId)
    expect(mockDataAccess.updateLearnedPreferences).toHaveBeenCalledWith(
      validUserId,
      expect.objectContaining({
        favoriteCuisines: expect.any(Array),
        favoriteIngredients: expect.any(Array),
        dislikedIngredients: expect.any(Array),
        dislikedCuisines: expect.any(Array),
      })
    )
  })

  it('does NOT call updateLearnedPreferences below threshold', async () => {
    const confirmedSession = { ...fakeSessionWithPlan, status: 'confirmed' as const }

    mockDataAccess.findSessionById
      .mockResolvedValueOnce(fakeSessionWithPlan)
      .mockResolvedValueOnce(confirmedSession)

    mockDataAccess.saveMealPlan.mockResolvedValue({ ...makeStoredPlan(validPlanId), id: validPlanId })
    mockDataAccess.updateSessionStatus.mockResolvedValue(confirmedSession as any)

    // Only 1 stored plan (below threshold of 3 plans and <21 meals)
    mockDataAccess.findMealPlansByUserId.mockResolvedValue([
      makeStoredPlan('p1'),
    ])
    mockDataAccess.findSessionsByUserId.mockResolvedValue([
      { ...confirmedSession, id: 's1' },
    ])

    const res = await request(app)
      .post(endpoint(validSessionId))
      .send({})

    expect(res.status).toBe(200)

    await new Promise(resolve => setImmediate(resolve))

    expect(mockDataAccess.updateLearnedPreferences).not.toHaveBeenCalled()
  })

  it('confirmation succeeds even if learning throws', async () => {
    const confirmedSession = { ...fakeSessionWithPlan, status: 'confirmed' as const }

    mockDataAccess.findSessionById
      .mockResolvedValueOnce(fakeSessionWithPlan)
      .mockResolvedValueOnce(confirmedSession)

    mockDataAccess.saveMealPlan.mockResolvedValue({ ...makeStoredPlan(validPlanId), id: validPlanId })
    mockDataAccess.updateSessionStatus.mockResolvedValue(confirmedSession as any)

    // Learning throws an error
    mockDataAccess.findMealPlansByUserId.mockRejectedValue(new Error('DB connection lost'))

    const res = await request(app)
      .post(endpoint(validSessionId))
      .send({})

    // Confirmation should still succeed
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)

    await new Promise(resolve => setImmediate(resolve))

    // updateLearnedPreferences was never reached because findMealPlansByUserId threw
    expect(mockDataAccess.updateLearnedPreferences).not.toHaveBeenCalled()
  })
})
