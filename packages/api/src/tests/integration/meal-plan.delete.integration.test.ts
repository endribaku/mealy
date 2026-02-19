import request from 'supertest'
import { createIntegrationApp } from '../utils/create-integration-app'
import { API_PREFIX, ROUTE_SEGMENTS } from '../../../src/routes/routes.constants'

import {
  IDataAccess,
  IContextBuilder,
  IMealPlanGenerator
} from '@mealy/engine'

describe('DELETE /api/meal-plans/:planId (Integration)', () => {

  let app: any
  let mockDataAccess: jest.Mocked<IDataAccess>
  let mockContextBuilder: jest.Mocked<IContextBuilder>
  let mockGenerator: jest.Mocked<IMealPlanGenerator>

  const validUserId = '550e8400-e29b-41d4-a716-446655440000'
  const validPlanId = '9f14e45f-ea4e-4cde-b123-123456789abc'

  const fakePlan = {
    id: validPlanId,
    userId: validUserId,   // must match testUser.id
    days: []
  } as any

  const endpoint = (planId: string) =>
    `${API_PREFIX}/${ROUTE_SEGMENTS.MEAL_PLANS}/${planId}`

  beforeEach(() => {

    mockDataAccess = {
      findMealPlanById: jest.fn(),
      deleteMealPlan: jest.fn(),
      findUserById: jest.fn() // important if service verifies user existence
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

  // ============================================================
  // 1️⃣ Validation: Invalid UUID
  // ============================================================

  it('returns 400 if params invalid', async () => {

    const res = await request(app)
      .delete(endpoint('invalid-id'))

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  // ============================================================
  // 2️⃣ Plan Not Found
  // ============================================================

  it('returns 404 if meal plan not found', async () => {

    mockDataAccess.findMealPlanById.mockResolvedValue(null)

    const res = await request(app)
      .delete(endpoint(validPlanId))

    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)

    expect(mockDataAccess.deleteMealPlan)
      .not.toHaveBeenCalled()
  })

  // ============================================================
  // 3️⃣ Plan Belongs to Another User
  // ============================================================

  it('returns 404 if meal plan belongs to another user', async () => {

    mockDataAccess.findMealPlanById.mockResolvedValue({
      ...fakePlan,
      userId: 'another-user'
    })

    const res = await request(app)
      .delete(endpoint(validPlanId))

    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)

    expect(mockDataAccess.deleteMealPlan)
      .not.toHaveBeenCalled()
  })

  // ============================================================
  // 4️⃣ Happy Path
  // ============================================================

  it('deletes meal plan successfully', async () => {

    mockDataAccess.findMealPlanById.mockResolvedValue(fakePlan)

    const res = await request(app)
      .delete(endpoint(validPlanId))

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.deleted).toBe(true)

    expect(mockDataAccess.deleteMealPlan)
      .toHaveBeenCalledWith(validPlanId)
  })
})
