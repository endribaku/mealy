import request from 'supertest'
import { createApp } from '../../../src/app/create-app'
import {
  IDataAccess,
  IContextBuilder,
  IMealPlanGenerator
} from '@mealy/engine'

describe('POST /api/users/:userId/sessions/:sessionId/regenerate-meal (Integration)', () => {

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

  const endpoint = (userId: string, sessionId: string) =>
    `/api/users/${userId}/sessions/${sessionId}/regenerate-meal`

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

    app = createApp({
      dataAccess: mockDataAccess,
      contextBuilder: mockContextBuilder,
      generator: mockGenerator
    })
  })

  // ============================================================
  // 1️⃣ Validation: Invalid UUID
  // ============================================================

  it('returns 400 if params invalid', async () => {

    const res = await request(app)
      .post(endpoint('invalid-id', validSessionId))
      .send({
        mealId: 'breakfast-day1',
        reason: 'Too repetitive'
      })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  // ============================================================
  // 2️⃣ Validation: Invalid Body
  // ============================================================

  it('returns 400 if body invalid', async () => {

    const res = await request(app)
      .post(endpoint(validUserId, validSessionId))
      .send({
        mealId: '', // invalid
        reason: ''
      })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  // ============================================================
  // 3️⃣ Session Not Found
  // ============================================================

  it('returns 404 if session not found', async () => {

    mockDataAccess.findUserById.mockResolvedValue(fakeUser)
    mockDataAccess.findSessionById.mockResolvedValue(null)

    const res = await request(app)
      .post(endpoint(validUserId, validSessionId))
      .send({
        mealId: 'breakfast-day1',
        reason: 'Too repetitive'
      })

    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })

  // ============================================================
  // 4️⃣ Unauthorized User
  // ============================================================

  it('returns 403 if user does not own session', async () => {

    mockDataAccess.findUserById.mockResolvedValue(fakeUser)
    mockDataAccess.findSessionById.mockResolvedValue({
      ...fakeSession,
      userId: 'another-user'
    })

    const res = await request(app)
      .post(endpoint(validUserId, validSessionId))
      .send({
        mealId: 'breakfast-day1',
        reason: 'Too repetitive'
      })

    expect(res.status).toBe(403)
    expect(res.body.success).toBe(false)
  })

  // ============================================================
  // 5️⃣ Happy Path
  // ============================================================

  it('regenerates single meal successfully', async () => {

    mockDataAccess.findUserById.mockResolvedValue(fakeUser)
    mockDataAccess.findSessionById.mockResolvedValue(fakeSession)

    mockContextBuilder.buildSessionContext.mockReturnValue(fakeSession)
    mockContextBuilder.buildFullContext.mockReturnValue(fakeContext)

    mockGenerator.regenerateSingleMeal.mockResolvedValue({
      mealPlan: fakeMealPlan,
      tokensUsed: { totalTokens: 50 },
      generationTime: 100,
      provider: 'openai'
    } as any)

    const res = await request(app)
      .post(endpoint(validUserId, validSessionId))
      .send({
        mealId: 'breakfast-day1',
        reason: 'Too repetitive'
      })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.mealPlan).toEqual(fakeMealPlan)

    expect(mockDataAccess.addSessionModification)
      .toHaveBeenCalled()

    expect(mockDataAccess.updateSessionMealPlan)
      .toHaveBeenCalledWith(validSessionId, fakeMealPlan)
  })

  // ============================================================
  // 6️⃣ AI Limiter Trigger
  // ============================================================

  it('returns 429 if AI limiter exceeded', async () => {

    mockDataAccess.findUserById.mockResolvedValue(fakeUser)
    mockDataAccess.findSessionById.mockResolvedValue(fakeSession)

    mockContextBuilder.buildSessionContext.mockReturnValue(fakeSession)
    mockContextBuilder.buildFullContext.mockReturnValue(fakeContext)

    mockGenerator.regenerateSingleMeal.mockResolvedValue({
      mealPlan: fakeMealPlan,
      tokensUsed: { totalTokens: 10 },
      generationTime: 50,
      provider: 'openai'
    } as any)

    for (let i = 0; i < 10; i++) {
      await request(app)
        .post(endpoint(validUserId, validSessionId))
        .send({
          mealId: 'breakfast-day1',
          reason: 'Too repetitive'
        })
    }

    const res = await request(app)
      .post(endpoint(validUserId, validSessionId))
      .send({
        mealId: 'breakfast-day1',
        reason: 'Too repetitive'
      })

    expect(res.status).toBe(429)
  })

})
