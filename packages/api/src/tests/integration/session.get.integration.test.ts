import request from 'supertest'
import { createApp } from '../../../src/app/create-app'
import {
  IDataAccess,
  IContextBuilder,
  IMealPlanGenerator
} from '@mealy/engine'

describe('GET /api/users/:userId/sessions/:sessionId (Integration)', () => {

  let app: any
  let mockDataAccess: jest.Mocked<IDataAccess>
  let mockContextBuilder: jest.Mocked<IContextBuilder>
  let mockGenerator: jest.Mocked<IMealPlanGenerator>

  const validUserId = '550e8400-e29b-41d4-a716-446655440000'
  const validSessionId = '550e8400-e29b-41d4-a716-446655440001'

  const fakeSession = {
    id: validSessionId,
    userId: validUserId
  } as any

  beforeEach(() => {

    mockDataAccess = {
      findSessionById: jest.fn()
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

  it('returns 400 if params invalid UUID', async () => {

    const res = await request(app)
      .get('/api/users/not-uuid/sessions/not-uuid')

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  // ============================================================
  // 2️⃣ Session Not Found
  // ============================================================

  it('returns 404 if session does not exist', async () => {

    mockDataAccess.findSessionById.mockResolvedValue(null)

    const res = await request(app)
      .get(`/api/users/${validUserId}/sessions/${validSessionId}`)

    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })

  // ============================================================
  // 3️⃣ Ownership Failure
  // ============================================================

  it('returns 404 if session does not belong to user', async () => {

    mockDataAccess.findSessionById.mockResolvedValue({
      id: validSessionId,
      userId: 'different-user'
    } as any)

    const res = await request(app)
      .get(`/api/users/${validUserId}/sessions/${validSessionId}`)

    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })

  // ============================================================
  // 4️⃣ Unknown Service Error
  // ============================================================

  it('returns 500 if service throws unknown error', async () => {

    mockDataAccess.findSessionById.mockRejectedValue(
      new Error('DB failure')
    )

    const res = await request(app)
      .get(`/api/users/${validUserId}/sessions/${validSessionId}`)

    expect(res.status).toBe(500)
    expect(res.body.success).toBe(false)
  })

  // ============================================================
  // 5️⃣ Happy Path
  // ============================================================

  it('returns session successfully', async () => {

    mockDataAccess.findSessionById.mockResolvedValue(fakeSession)

    const res = await request(app)
      .get(`/api/users/${validUserId}/sessions/${validSessionId}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.id).toBe(validSessionId)

    expect(mockDataAccess.findSessionById)
      .toHaveBeenCalledWith(validSessionId)
  })

})
