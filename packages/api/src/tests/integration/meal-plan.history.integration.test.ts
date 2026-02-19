import request from 'supertest'
import { createIntegrationApp } from '../utils/create-integration-app'
import { API_PREFIX, ROUTE_SEGMENTS } from '../../../src/routes/routes.constants'

import {
  IDataAccess,
  IContextBuilder,
  IMealPlanGenerator
} from '@mealy/engine'

describe('GET /api/meal-plans (Integration)', () => {

  let app: any
  let mockDataAccess: jest.Mocked<IDataAccess>
  let mockContextBuilder: jest.Mocked<IContextBuilder>
  let mockGenerator: jest.Mocked<IMealPlanGenerator>

  const validUserId = '550e8400-e29b-41d4-a716-446655440000'
  const fakeUser = { id: validUserId } as any

  const fakePlans = [
    { id: 'plan-1', userId: validUserId, days: [] },
    { id: 'plan-2', userId: validUserId, days: [] }
  ] as any

  const endpoint = () =>
    `${API_PREFIX}/${ROUTE_SEGMENTS.MEAL_PLANS}`

  beforeEach(() => {

    mockDataAccess = {
      findUserById: jest.fn(),
      findMealPlansByUserId: jest.fn()
    } as any

    // 🔥 user existence guard
    mockDataAccess.findUserById.mockResolvedValue(fakeUser)

    mockContextBuilder = {} as any
    mockGenerator = {} as any

    app = createIntegrationApp({
      dataAccess: mockDataAccess,
      contextBuilder: mockContextBuilder,
      generator: mockGenerator,
      testUser: fakeUser
    })
  })

  it('returns empty array if no meal plans', async () => {

    mockDataAccess.findMealPlansByUserId.mockResolvedValue([])

    const res = await request(app).get(endpoint())

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toEqual([])
  })

  it('returns list of meal plans', async () => {

    mockDataAccess.findMealPlansByUserId.mockResolvedValue(fakePlans)

    const res = await request(app).get(endpoint())

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toEqual(fakePlans)

    expect(mockDataAccess.findMealPlansByUserId)
      .toHaveBeenCalledWith(validUserId)
  })

})
