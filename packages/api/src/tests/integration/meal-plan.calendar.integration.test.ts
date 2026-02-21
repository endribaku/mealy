import request from 'supertest'
import { createIntegrationApp } from '../utils/create-integration-app'
import { API_PREFIX, ROUTE_SEGMENTS } from '../../../src/routes/routes.constants'

import {
  IDataAccess,
  IContextBuilder,
  IMealPlanGenerator
} from '@mealy/engine'

describe('GET /api/meal-plans/calendar (Integration)', () => {

  let app: any
  let mockDataAccess: jest.Mocked<IDataAccess>
  let mockContextBuilder: jest.Mocked<IContextBuilder>
  let mockGenerator: jest.Mocked<IMealPlanGenerator>

  const validUserId = '550e8400-e29b-41d4-a716-446655440000'

  const endpoint = `${API_PREFIX}/${ROUTE_SEGMENTS.MEAL_PLANS}/calendar`

  const fakePlan = {
    id: 'plan-1',
    userId: validUserId,
    mealPlan: { days: [], nutritionSummary: { avgDailyCalories: 2000, avgProtein: 100 } },
    createdAt: '2026-02-21T00:00:00.000Z',
    status: 'active',
    startDate: '2026-02-21',
    endDate: '2026-02-27'
  }

  beforeEach(() => {

    mockDataAccess = {
      findUserById: jest.fn().mockResolvedValue({ id: validUserId }),
      findMealPlansByDateRange: jest.fn()
    } as any

    mockContextBuilder = {} as any
    mockGenerator = {} as any

    app = createIntegrationApp({
      dataAccess: mockDataAccess,
      contextBuilder: mockContextBuilder,
      generator: mockGenerator,
      testUser: { id: validUserId }
    })
  })

  it('returns 400 if from param is missing', async () => {

    const res = await request(app)
      .get(endpoint)
      .query({ to: '2026-02-28' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('returns 400 if to param is missing', async () => {

    const res = await request(app)
      .get(endpoint)
      .query({ from: '2026-02-01' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('returns 400 if date format is invalid', async () => {

    const res = await request(app)
      .get(endpoint)
      .query({ from: 'bad-date', to: '2026-02-28' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('returns plans within date range', async () => {

    mockDataAccess.findMealPlansByDateRange.mockResolvedValue([fakePlan] as any)

    const res = await request(app)
      .get(endpoint)
      .query({ from: '2026-02-01', to: '2026-02-28' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toEqual([fakePlan])

    expect(mockDataAccess.findMealPlansByDateRange)
      .toHaveBeenCalledWith(validUserId, '2026-02-01', '2026-02-28')
  })

  it('returns empty array when no plans in range', async () => {

    mockDataAccess.findMealPlansByDateRange.mockResolvedValue([])

    const res = await request(app)
      .get(endpoint)
      .query({ from: '2026-03-01', to: '2026-03-31' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toEqual([])
  })

})
