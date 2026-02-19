import request from 'supertest'
import { createIntegrationApp } from '../utils/create-integration-app'
import { API_PREFIX, ROUTE_SEGMENTS } from '../../../src/routes/routes.constants'

import {
  IDataAccess,
  IContextBuilder,
  IMealPlanGenerator
} from '@mealy/engine'

describe('POST /api/meal-plans/sessions/:sessionId/regenerate (Integration)', () => {

  let app: any
  let mockDataAccess: jest.Mocked<IDataAccess>
  let mockContextBuilder: jest.Mocked<IContextBuilder>
  let mockGenerator: jest.Mocked<IMealPlanGenerator>

  const validUserId = '550e8400-e29b-41d4-a716-446655440000'
  const validSessionId = '8f14e45f-ea4e-4cde-b123-123456789abc'

  const fakeUser = { id: validUserId } as any

  const fakeSession = {
    id: validSessionId,
    userId: validUserId,
    currentMealPlan: { days: [] },
    modifications: [],
    temporaryConstraints: []
  } as any

  const fakeContext = {} as any
  const fakeMealPlan = { days: [{ meals: {} }] } as any

  const endpoint = (sessionId: string) =>
    `${API_PREFIX}/${ROUTE_SEGMENTS.MEAL_PLANS}/${ROUTE_SEGMENTS.SESSIONS}/${sessionId}/${ROUTE_SEGMENTS.REGENERATE}`

  beforeEach(() => {

    mockDataAccess = {
      findUserById: jest.fn(),
      findSessionById: jest.fn(),
      addSessionModification: jest.fn(),
      updateSessionMealPlan: jest.fn()
    } as any

    // 🔥 IMPORTANT — user existence guard
    mockDataAccess.findUserById.mockResolvedValue(fakeUser)

    mockContextBuilder = {
      buildFullContext: jest.fn(),
      buildSessionContext: jest.fn()
    } as any

    mockGenerator = {
      regenerateFullPlan: jest.fn()
    } as any

    app = createIntegrationApp({
      dataAccess: mockDataAccess,
      contextBuilder: mockContextBuilder,
      generator: mockGenerator,
      testUser: { id: validUserId }
    })
  })

  // ============================================================
  // 1️⃣ Validation: Invalid UUID
  // ============================================================

  it('returns 400 if params invalid', async () => {

    const res = await request(app)
      .post(endpoint('invalid-id'))
      .send({ reason: 'Change everything' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  // ============================================================
  // 2️⃣ Validation: Invalid Body
  // ============================================================

  it('returns 400 if body invalid', async () => {

    const res = await request(app)
      .post(endpoint(validSessionId))
      .send({ reason: '' }) // invalid (min 1)

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  // ============================================================
  // 3️⃣ Session Not Found
  // ============================================================

  it('returns 404 if session not found', async () => {

    mockDataAccess.findSessionById.mockResolvedValue(null)

    const res = await request(app)
      .post(endpoint(validSessionId))
      .send({ reason: 'Change everything' })

    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })

  // ============================================================
  // 4️⃣ Unauthorized User (Ownership Guard)
  // ============================================================

  it('returns 404 if user does not own session', async () => {

    mockDataAccess.findSessionById.mockResolvedValue({
      ...fakeSession,
      userId: 'another-user'
    })

    const res = await request(app)
      .post(endpoint(validSessionId))
      .send({ reason: 'Change everything' })

    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })

  // ============================================================
  // 5️⃣ Happy Path
  // ============================================================

  it('regenerates full plan successfully', async () => {

    mockDataAccess.findSessionById.mockResolvedValue(fakeSession)

    mockContextBuilder.buildSessionContext.mockReturnValue(fakeSession)
    mockContextBuilder.buildFullContext.mockReturnValue(fakeContext)

    mockGenerator.regenerateFullPlan.mockResolvedValue({
      mealPlan: fakeMealPlan,
      tokensUsed: { totalTokens: 80 },
      generationTime: 150,
      provider: 'openai'
    } as any)

    const res = await request(app)
      .post(endpoint(validSessionId))
      .send({ reason: 'Change everything' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.mealPlan).toEqual(fakeMealPlan)

    expect(mockDataAccess.addSessionModification)
      .toHaveBeenCalled()

    expect(mockDataAccess.updateSessionMealPlan)
      .toHaveBeenCalledWith(validSessionId, fakeMealPlan)
  })

})
