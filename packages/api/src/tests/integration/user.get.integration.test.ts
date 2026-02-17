import request from 'supertest'
import { createApp } from '../../../src/app/create-app'
import {
  IDataAccess,
  IContextBuilder,
  IMealPlanGenerator
} from '@mealy/engine'

describe('GET /api/users/:userId (Integration)', () => {

  let app: any
  let mockDataAccess: jest.Mocked<IDataAccess>
  let mockContextBuilder: jest.Mocked<IContextBuilder>
  let mockGenerator: jest.Mocked<IMealPlanGenerator>

  const validUserId = '550e8400-e29b-41d4-a716-446655440000'

  const fakeUser = {
    id: validUserId,
    email: 'test@example.com',
    profile: { name: 'John' }
  } as any

  beforeEach(() => {

    mockDataAccess = {
      findUserById: jest.fn()
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
  // 1️⃣ Invalid UUID
  // ============================================================

  it('returns 400 if userId is invalid UUID', async () => {

    const res = await request(app)
      .get('/api/users/not-a-valid-uuid')

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  // ============================================================
  // 2️⃣ User Not Found
  // ============================================================

  it('returns 404 if user does not exist', async () => {

    mockDataAccess.findUserById.mockResolvedValue(null)

    const res = await request(app)
      .get(`/api/users/${validUserId}`)

    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })

  // ============================================================
  // 3️⃣ Service Throws Unknown Error
  // ============================================================

  it('returns 500 if service throws unknown error', async () => {

    mockDataAccess.findUserById.mockRejectedValue(
      new Error('Database failure')
    )

    const res = await request(app)
      .get(`/api/users/${validUserId}`)

    expect(res.status).toBe(500)
    expect(res.body.success).toBe(false)
  })

  // ============================================================
  // 4️⃣ Happy Path
  // ============================================================

  it('returns user successfully', async () => {

    mockDataAccess.findUserById.mockResolvedValue(fakeUser)

    const res = await request(app)
      .get(`/api/users/${validUserId}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.id).toBe(validUserId)

    expect(mockDataAccess.findUserById)
      .toHaveBeenCalledWith(validUserId)
  })

})
