import request from 'supertest'
import { createApp } from '../../../src/app/create-app'
import {
  IDataAccess,
  IContextBuilder,
  IMealPlanGenerator
} from '@mealy/engine'

describe('PATCH /api/users/:userId/restrictions (Integration)', () => {

  let app: any
  let mockDataAccess: jest.Mocked<IDataAccess>
  let mockContextBuilder: jest.Mocked<IContextBuilder>
  let mockGenerator: jest.Mocked<IMealPlanGenerator>

  const validUserId = '550e8400-e29b-41d4-a716-446655440000'

  const fakeUser = {
    id: validUserId,
    email: 'test@example.com'
  } as any

  beforeEach(() => {

    mockDataAccess = {
      findUserById: jest.fn(),
      updateDietaryRestrictions: jest.fn()
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

  it('returns 400 if userId invalid UUID', async () => {

    const res = await request(app)
      .patch('/api/users/not-a-valid-uuid/restrictions')
      .send({ vegetarian: true })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  // ============================================================
  // 2️⃣ Body Validation Failure (Wrong Type)
  // ============================================================

  it('returns 400 if body has invalid types', async () => {

    const res = await request(app)
      .patch(`/api/users/${validUserId}/restrictions`)
      .send({ vegetarian: 'yes' }) // invalid boolean

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  // ============================================================
  // 3️⃣ Strict Mode Rejection
  // ============================================================

  it('returns 400 if body contains unknown field', async () => {

    const res = await request(app)
      .patch(`/api/users/${validUserId}/restrictions`)
      .send({ unknown: true })

    expect(res.status).toBe(400)
  })

  // ============================================================
  // 4️⃣ Guard Failure — User Not Found
  // ============================================================

  it('returns 404 if user does not exist', async () => {

    mockDataAccess.findUserById.mockResolvedValue(null)

    const res = await request(app)
      .patch(`/api/users/${validUserId}/restrictions`)
      .send({ vegetarian: true })

    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)

    expect(mockDataAccess.updateDietaryRestrictions)
      .not.toHaveBeenCalled()
  })

  // ============================================================
  // 5️⃣ Service Throws Unknown Error
  // ============================================================

  it('returns 500 if service throws unknown error', async () => {

    mockDataAccess.findUserById.mockResolvedValue(fakeUser)
    mockDataAccess.updateDietaryRestrictions.mockRejectedValue(
      new Error('Database failure')
    )

    const res = await request(app)
      .patch(`/api/users/${validUserId}/restrictions`)
      .send({ vegetarian: true })

    expect(res.status).toBe(500)
    expect(res.body.success).toBe(false)
  })

  // ============================================================
  // 6️⃣ Happy Path
  // ============================================================

  it('updates dietary restrictions successfully', async () => {

    mockDataAccess.findUserById.mockResolvedValue(fakeUser)
    mockDataAccess.updateDietaryRestrictions.mockResolvedValue(fakeUser)

    const res = await request(app)
      .patch(`/api/users/${validUserId}/restrictions`)
      .send({ vegetarian: true })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)

    expect(mockDataAccess.updateDietaryRestrictions)
      .toHaveBeenCalledWith(validUserId, {
        vegetarian: true
      })
  })

})
