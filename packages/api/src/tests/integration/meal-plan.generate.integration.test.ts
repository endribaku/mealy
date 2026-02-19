import request from 'supertest'
import { createIntegrationApp } from '../utils/create-integration-app'
import { API_PREFIX, ROUTE_SEGMENTS } from '../../../src/routes/routes.constants'

import {
  IDataAccess,
  IContextBuilder,
  IMealPlanGenerator
} from '@mealy/engine'

describe('POST /api/meal-plans (Integration)', () => {

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

  const endpoint = () =>
    `${API_PREFIX}/${ROUTE_SEGMENTS.MEAL_PLANS}`

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

    app = createIntegrationApp({
      dataAccess: mockDataAccess,
      contextBuilder: mockContextBuilder,
      generator: mockGenerator,
      testUser: {id: validUserId}
    })
  })

  // ============================================================
  // 1️⃣ Body Validation Failure
  // ============================================================

  it('returns 400 if body invalid', async () => {

    const res = await request(app)
      .post(endpoint())
      .send({ invalid: true }) // invalid body

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  // ============================================================
  // 2️⃣ User Not Found
  // ============================================================

  it('returns 404 if user does not exist', async () => {

    mockDataAccess.findUserById.mockResolvedValue(null)

    const res = await request(app)
      .post(endpoint())
      .send({ options: {} })

    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)

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
      .post(endpoint())
      .send({
        options: {
          temperature: 0.5
        }
      })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)

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

    for (let i = 0; i < 10; i++) {
      await request(app)
        .post(endpoint())
        .send({ options: {} })
    }

    const res = await request(app)
      .post(endpoint())
      .send({ options: {} })

    expect(res.status).toBe(429)
  })
})
