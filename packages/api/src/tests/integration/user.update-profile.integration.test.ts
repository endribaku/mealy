import request from 'supertest'
import { createApp } from '../../../src/app/create-app'
import {
  IDataAccess,
  IContextBuilder,
  IMealPlanGenerator
} from '@mealy/engine'

describe('PATCH /api/users/:userId/profile (Integration)', () => {

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
      findUserById: jest.fn(),
      updateUserProfile: jest.fn()
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

  it('returns 400 if userId invalid', async () => {

    const res = await request(app)
      .patch('/api/users/not-a-uuid/profile')
      .send({ name: 'Updated' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  // ============================================================
  // 2️⃣ Body Validation Failure
  // ============================================================

  it('returns 400 if body invalid type', async () => {

    const res = await request(app)
      .patch(`/api/users/${validUserId}/profile`)
      .send({ name: 123 }) // invalid type

    expect(res.status).toBe(400)
  })

  // ============================================================
  // 3️⃣ Strict Mode Rejection
  // ============================================================

  it('returns 400 if body contains unknown field', async () => {

    const res = await request(app)
      .patch(`/api/users/${validUserId}/profile`)
      .send({ name: 'John', unknown: true })

    expect(res.status).toBe(400)
  })

  // ============================================================
  // 4️⃣ User Not Found Guard
  // ============================================================

  it('returns 404 if user does not exist', async () => {

    mockDataAccess.findUserById.mockResolvedValue(null)

    const res = await request(app)
      .patch(`/api/users/${validUserId}/profile`)
      .send({ name: 'Updated' })

    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })

  // ============================================================
  // 5️⃣ Service Throws Unexpected Error
  // ============================================================

  it('returns 500 if service throws unknown error', async () => {

    mockDataAccess.findUserById.mockResolvedValue(fakeUser)
    mockDataAccess.updateUserProfile.mockRejectedValue(
      new Error('DB failure')
    )

    const res = await request(app)
      .patch(`/api/users/${validUserId}/profile`)
      .send({ name: 'Updated' })

    expect(res.status).toBe(500)
    expect(res.body.success).toBe(false)
  })

  // ============================================================
  // 6️⃣ Happy Path
  // ============================================================

  it('updates profile successfully', async () => {

    mockDataAccess.findUserById.mockResolvedValue(fakeUser)
    mockDataAccess.updateUserProfile.mockResolvedValue(fakeUser)

    const res = await request(app)
      .patch(`/api/users/${validUserId}/profile`)
      .send({ name: 'Updated' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)

    expect(mockDataAccess.updateUserProfile)
      .toHaveBeenCalledWith(validUserId, { name: 'Updated' })
  })

})
