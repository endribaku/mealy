import request from 'supertest'
import { createApp } from '../../../src/app/create-app'
import {
  IDataAccess,
  IContextBuilder,
  IMealPlanGenerator
} from '@mealy/engine'

describe('DELETE /api/users/:userId (Integration)', () => {

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
      deleteUser: jest.fn()
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
  // 1️⃣ Param Validation Failure
  // ============================================================

  it('returns 400 if userId is invalid UUID', async () => {

    const res = await request(app)
      .delete('/api/users/not-a-valid-uuid')

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  // ============================================================
  // 2️⃣ Guard Failure — User Not Found
  // ============================================================

  it('returns 404 if user does not exist', async () => {

    mockDataAccess.findUserById.mockResolvedValue(null)

    const res = await request(app)
      .delete(`/api/users/${validUserId}`)

    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)

    // deleteUser should NOT be called
    expect(mockDataAccess.deleteUser).not.toHaveBeenCalled()
  })

  // ============================================================
  // 3️⃣ Service Unexpected Error
  // ============================================================

  it('returns 500 if delete operation throws unknown error', async () => {

    mockDataAccess.findUserById.mockResolvedValue(fakeUser)
    mockDataAccess.deleteUser.mockRejectedValue(
      new Error('Database failure')
    )

    const res = await request(app)
      .delete(`/api/users/${validUserId}`)

    expect(res.status).toBe(500)
    expect(res.body.success).toBe(false)
  })

  // ============================================================
  // 4️⃣ Happy Path
  // ============================================================

  it('deletes user successfully', async () => {

    mockDataAccess.findUserById.mockResolvedValue(fakeUser)
    mockDataAccess.deleteUser.mockResolvedValue(true)

    const res = await request(app)
      .delete(`/api/users/${validUserId}`)

    // HTTP Layer
    expect(res.status).toBe(200)

    // JSON formatting
    expect(res.body.success).toBe(true)
    expect(res.body.data).toEqual({ deleted: true })

    // Service execution verification
    expect(mockDataAccess.findUserById)
      .toHaveBeenCalledWith(validUserId)

    expect(mockDataAccess.deleteUser)
      .toHaveBeenCalledWith(validUserId)
  })

})
