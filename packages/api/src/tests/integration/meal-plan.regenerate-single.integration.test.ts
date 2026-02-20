import request from 'supertest'
import { createIntegrationApp } from '../utils/create-integration-app'
import { API_PREFIX, ROUTE_SEGMENTS } from '../../../src/routes/routes.constants'

import {
  IDataAccess,
  IContextBuilder,
  IMealPlanGenerator
} from '@mealy/engine'

describe('POST /api/meal-plans/sessions/:sessionId/regenerate-meal (Integration)', () => {

  let app: any
  let mockDataAccess: jest.Mocked<IDataAccess>
  let mockContextBuilder: jest.Mocked<IContextBuilder>
  let mockGenerator: jest.Mocked<IMealPlanGenerator>

  const validUserId = '550e8400-e29b-41d4-a716-446655440000'
  const validSessionId = '8f14e45f-ea4e-4cde-b123-123456789abc'

  const fakeSession = {
    id: validSessionId,
    userId: validUserId,
    currentMealPlan: { days: [] },
    modifications: [],
    temporaryConstraints: []
  } as any
  const fakeUser = { id: validUserId } as any

  const fakeContext = {} as any
  const fakeMealPlan = { days: [{ meals: {} }] } as any

  const endpoint = (sessionId: string) =>
    `${API_PREFIX}/${ROUTE_SEGMENTS.MEAL_PLANS}/${ROUTE_SEGMENTS.SESSIONS}/${sessionId}/${ROUTE_SEGMENTS.REGENERATE_MEAL}`

  beforeEach(() => {

    mockDataAccess = {
      findUserById: jest.fn(),
      findSessionById: jest.fn(),
      addSessionModification: jest.fn(),
      updateSessionMealPlan: jest.fn()
    } as any



    mockContextBuilder = {
      buildFullContext: jest.fn(),
      buildSessionContext: jest.fn()
    } as any

    mockGenerator = {
      regenerateSingleMeal: jest.fn()
    } as any

    app = createIntegrationApp({
      dataAccess: mockDataAccess,
      contextBuilder: mockContextBuilder,
      generator: mockGenerator,
      testUser: { id: validUserId }
    })
  })

  it('returns 400 if params invalid', async () => {

    const res = await request(app)
      .post(endpoint('invalid-id'))
      .send({
        mealId: 'breakfast-day1',
        reason: 'Too repetitive'
      })

    expect(res.status).toBe(400)
  })

  it('returns 404 if session not found', async () => {

    mockDataAccess.findSessionById.mockResolvedValue(null)

    const res = await request(app)
      .post(endpoint(validSessionId))
      .send({
        mealId: 'breakfast-day1',
        reason: 'Too repetitive'
      })

    expect(res.status).toBe(404)
  })

  it('returns 404 if user does not own session', async () => {

    mockDataAccess.findSessionById.mockResolvedValue({
      ...fakeSession,
      userId: 'another-user'
    })

    const res = await request(app)
      .post(endpoint(validSessionId))
      .send({
        mealId: 'breakfast-day1',
        reason: 'Too repetitive'
      })

    expect(res.status).toBe(404)
  })

  it('regenerates single meal successfully', async () => {

    const updatedSession = {
      ...fakeSession,
      currentMealPlan: fakeMealPlan
    }

    mockDataAccess.findUserById.mockResolvedValue(fakeUser)

    mockDataAccess.findSessionById
      .mockResolvedValueOnce(fakeSession)      // guard
      .mockResolvedValueOnce(updatedSession)   // final return

    mockContextBuilder.buildSessionContext.mockReturnValue(fakeSession)
    mockContextBuilder.buildFullContext.mockReturnValue(fakeContext)

    mockGenerator.regenerateSingleMeal.mockResolvedValue({
      mealPlan: fakeMealPlan,
      tokensUsed: { totalTokens: 50 },
      generationTime: 100,
      provider: 'openai'
    } as any)

    mockDataAccess.addSessionModification.mockResolvedValue(updatedSession)
    mockDataAccess.updateSessionMealPlan.mockResolvedValue(updatedSession)

    const res = await request(app)
      .post(endpoint(validSessionId))
      .send({
        mealId: 'breakfast-day1',
        reason: 'Too repetitive'
      })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)

    expect(res.body.data.session).toEqual(updatedSession)

    expect(mockDataAccess.updateSessionMealPlan)
      .toHaveBeenCalledWith(validSessionId, fakeMealPlan)
  })


})
