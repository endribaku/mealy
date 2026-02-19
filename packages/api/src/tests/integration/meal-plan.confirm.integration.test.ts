import request from 'supertest'
import { createIntegrationApp } from '../utils/create-integration-app'
import { API_PREFIX, ROUTE_SEGMENTS } from '../../../src/routes/routes.constants'

import {
  IDataAccess,
  IContextBuilder,
  IMealPlanGenerator
} from '@mealy/engine'

describe('POST /api/meal-plans/:sessionId/confirm (Integration)', () => {

  let app: any
  let mockDataAccess: jest.Mocked<IDataAccess>
  let mockContextBuilder: jest.Mocked<IContextBuilder>
  let mockGenerator: jest.Mocked<IMealPlanGenerator>

  const validUserId = '550e8400-e29b-41d4-a716-446655440000'
  const validSessionId = '8f14e45f-ea4e-4cde-b123-123456789abc'
  const validPlanId = '9f14e45f-ea4e-4cde-b123-123456789abc'

  const fakeSessionWithPlan = {
    id: validSessionId,
    userId: validUserId,
    currentMealPlan: { days: [] }
  } as any

  const fakeSessionWithoutPlan = {
    id: validSessionId,
    userId: validUserId,
    currentMealPlan: null
  } as any

  const savedPlan = {
    id: validPlanId,
    userId: validUserId,
    days: []
  } as any

  const endpoint = (sessionId: string) =>
  `${API_PREFIX}/${ROUTE_SEGMENTS.MEAL_PLANS}/${ROUTE_SEGMENTS.SESSIONS}/${sessionId}/${ROUTE_SEGMENTS.CONFIRM}`

  beforeEach(() => {

    mockDataAccess = {
      findUserById: jest.fn(),
      findSessionById: jest.fn(),
      saveMealPlan: jest.fn()
    } as any

    mockContextBuilder = {} as any
    mockGenerator = {} as any

    app = createIntegrationApp({
      dataAccess: mockDataAccess,
      contextBuilder: mockContextBuilder,
      generator: mockGenerator,
      testUser: {id: validUserId}
    })
  })

  it('returns 400 if params invalid', async () => {

    const res = await request(app)
      .post(endpoint('invalid-id'))

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('returns 404 if session not found', async () => {

    mockDataAccess.findSessionById.mockResolvedValue(null)

    const res = await request(app)
      .post(endpoint(validSessionId))

    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })

  it('returns 404 if user does not own session', async () => {

    mockDataAccess.findSessionById.mockResolvedValue({
      ...fakeSessionWithPlan,
      userId: 'another-user'
    })

    const res = await request(app)
      .post(endpoint(validSessionId))

    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })

  it('returns 400 if no meal plan to confirm', async () => {

    mockDataAccess.findSessionById.mockResolvedValue(fakeSessionWithoutPlan)

    const res = await request(app)
      .post(endpoint(validSessionId))

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('confirms meal plan successfully', async () => {

    mockDataAccess.findSessionById.mockResolvedValue(fakeSessionWithPlan)
    mockDataAccess.saveMealPlan.mockResolvedValue(savedPlan)

    const res = await request(app)
      .post(endpoint(validSessionId))

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.mealPlan).toEqual(savedPlan)

    expect(mockDataAccess.saveMealPlan)
      .toHaveBeenCalledWith(
        validUserId,
        fakeSessionWithPlan.currentMealPlan
      )
  })
})
