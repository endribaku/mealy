import request from 'supertest'
import { createApp } from '../../../src/app/create-app'
import {
  IDataAccess,
  IContextBuilder,
  IMealPlanGenerator
} from '@mealy/engine'

describe('GET /api/users/:userId/meal-plans (Integration)', () => {

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

  const endpoint = (userId: string) =>
    `/api/users/${userId}/meal-plans`

  beforeEach(() => {

    mockDataAccess = {
      findUserById: jest.fn(),
      findMealPlansByUserId: jest.fn()
    } as any

    mockContextBuilder = {} as any
    mockGenerator = {} as any

    app = createApp({
      dataAccess: mockDataAccess,
      contextBuilder: mockContextBuilder,
      generator: mockGenerator
    })
  })

  // ============================================================
  // 1️⃣ Validation: Invalid UUID
  // ============================================================

  it('returns 400 if userId invalid', async () => {

    const res = await request(app)
      .get(endpoint('invalid-id'))

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  // ============================================================
  // 2️⃣ User Not Found
  // ============================================================

  it('returns 404 if user does not exist', async () => {

    mockDataAccess.findUserById.mockResolvedValue(null)

    const res = await request(app)
      .get(endpoint(validUserId))

    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })

  // ============================================================
  // 3️⃣ Empty History
  // ============================================================

  it('returns empty array if no meal plans', async () => {

    mockDataAccess.findUserById.mockResolvedValue(fakeUser)
    mockDataAccess.findMealPlansByUserId.mockResolvedValue([])

    const res = await request(app)
      .get(endpoint(validUserId))

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toEqual([])
  })

  // ============================================================
  // 4️⃣ Returns Meal Plans
  // ============================================================

  it('returns list of meal plans', async () => {

    mockDataAccess.findUserById.mockResolvedValue(fakeUser)
    mockDataAccess.findMealPlansByUserId.mockResolvedValue(fakePlans)

    const res = await request(app)
      .get(endpoint(validUserId))

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toEqual(fakePlans)

    expect(mockDataAccess.findMealPlansByUserId)
      .toHaveBeenCalledWith(validUserId)
  })

})
