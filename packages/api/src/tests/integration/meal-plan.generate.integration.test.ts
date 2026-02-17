import request from 'supertest'
import { createApp } from '../../../src/app/create-app'
import {
  IDataAccess,
  IContextBuilder,
  IMealPlanGenerator
} from '@mealy/engine'

describe('POST /api/users/:userId/meal-plans (Integration)', () => {

  let app: any
  let mockDataAccess: jest.Mocked<IDataAccess>
  let mockContextBuilder: jest.Mocked<IContextBuilder>
  let mockGenerator: jest.Mocked<IMealPlanGenerator>

  const validUserId = '550e8400-e29b-41d4-a716-446655440000'

  const fakeUser = { id: validUserId } as any
  const fakeSession = {
    id: '8f14e45f-ea4e-4cde-b123-123456789abc'
  } as any

  const fakeMealPlan = { days: [] } as any
  const fakeContext = {} as any

  const endpoint = (id: string) => `/api/users/${id}/meal-plans`

  beforeEach(() => {

    mockDataAccess = {
      findUserById: jest.fn(),
      createSession: jest.fn(),
      updateSessionMealPlan: jest.fn()
    } as any

    mockContextBuilder = {
      buildFullContext: jest.fn()
    } as any

    mockGenerator = {
      generateMealPlan: jest.fn()
    } as any

    app = createApp({
      dataAccess: mockDataAccess,
      contextBuilder: mockContextBuilder,
      generator: mockGenerator
    })
  })

  // ============================================================
  // 1️⃣ Validation Failure
  // ============================================================

  it('returns 400 if userId param invalid (validation)', async () => {

    const res = await request(app)
      .post(endpoint('not-a-valid-uuid'))
      .send({ options: {} }) // 🔥 valid body shape

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  // ============================================================
  // 2️⃣ User Not Found (Service Guard)
  // ============================================================

  it('returns 404 if user does not exist', async () => {

    mockDataAccess.findUserById.mockResolvedValue(null)

    const res = await request(app)
      .post(endpoint(validUserId))
      .send({ options: {} }) // 🔥 valid body shape

    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
    expect(res.body.message).toBeDefined()

    expect(mockGenerator.generateMealPlan)
      .not.toHaveBeenCalled()
  })

  // ============================================================
  // 3️⃣ Happy Path
  // ============================================================

  it('generates meal plan successfully', async () => {

    mockDataAccess.findUserById.mockResolvedValue(fakeUser)
    mockContextBuilder.buildFullContext.mockReturnValue(fakeContext)

    mockGenerator.generateMealPlan.mockResolvedValue({
      mealPlan: fakeMealPlan,
      tokensUsed: { totalTokens: 123 },
      generationTime: 200,
      provider: 'openai'
    } as any)

    mockDataAccess.createSession.mockResolvedValue(fakeSession)

    const res = await request(app)
      .post(endpoint(validUserId))
      .send({
        options: {
          temperature: 0.5
        }
      })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)

    expect(res.body.data).toHaveProperty('sessionId')
    expect(res.body.data).toHaveProperty('mealPlan')
    expect(res.body.data).toHaveProperty('metadata')

    expect(res.body.data.sessionId).toBe(fakeSession.id)
    expect(res.body.data.mealPlan).toEqual(fakeMealPlan)
    expect(res.body.data.metadata.tokensUsed).toBe(123)

    expect(mockContextBuilder.buildFullContext)
      .toHaveBeenCalled()

    expect(mockGenerator.generateMealPlan)
      .toHaveBeenCalled()

    expect(mockDataAccess.updateSessionMealPlan)
      .toHaveBeenCalledWith(fakeSession.id, fakeMealPlan)
  })

  // ============================================================
  // 4️⃣ AI Limiter Trigger
  // ============================================================

  it('returns 429 if AI limiter exceeded', async () => {

    mockDataAccess.findUserById.mockResolvedValue(fakeUser)
    mockContextBuilder.buildFullContext.mockReturnValue(fakeContext)

    mockGenerator.generateMealPlan.mockResolvedValue({
      mealPlan: fakeMealPlan,
      tokensUsed: { totalTokens: 10 },
      generationTime: 50,
      provider: 'openai'
    } as any)

    mockDataAccess.createSession.mockResolvedValue(fakeSession)

    // Trigger limit 10 times
    for (let i = 0; i < 10; i++) {
      await request(app)
        .post(endpoint(validUserId))
        .send({ options: {} }) // 🔥 valid body shape
    }

    const res = await request(app)
      .post(endpoint(validUserId))
      .send({ options: {} }) // 🔥 valid body shape

    expect(res.status).toBe(429)
  })

})
