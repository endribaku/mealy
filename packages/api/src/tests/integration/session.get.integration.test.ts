import request from 'supertest'
import { createIntegrationApp } from '../utils/create-integration-app'
import { API_PREFIX, ROUTE_SEGMENTS } from '../../../src/routes/routes.constants'

import {
  IDataAccess,
  IContextBuilder,
  IMealPlanGenerator
} from '@mealy/engine'

describe('GET /api/sessions/:sessionId (Integration)', () => {

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

  const endpoint = (sessionId: string) =>
    `${API_PREFIX}/${ROUTE_SEGMENTS.SESSIONS}/${sessionId}`

  beforeEach(() => {

    mockDataAccess = {
      findSessionById: jest.fn()
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

  it('returns 400 if sessionId invalid UUID', async () => {

    const res = await request(app)
      .get(endpoint('not-uuid'))

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('returns 404 if session does not exist', async () => {

    mockDataAccess.findSessionById.mockResolvedValue(null)

    const res = await request(app)
      .get(endpoint(validSessionId))

    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })

  it('returns 404 if session does not belong to user', async () => {

    mockDataAccess.findSessionById.mockResolvedValue({
      id: validSessionId,
      userId: 'different-user'
    } as any)

    const res = await request(app)
      .get(endpoint(validSessionId))

    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })

  it('returns 500 if service throws unknown error', async () => {

    mockDataAccess.findSessionById.mockRejectedValue(
      new Error('DB failure')
    )

    const res = await request(app)
      .get(endpoint(validSessionId))

    expect(res.status).toBe(500)
    expect(res.body.success).toBe(false)
  })

  it('returns session successfully', async () => {

    mockDataAccess.findSessionById.mockResolvedValue(fakeSession)

    const res = await request(app)
      .get(endpoint(validSessionId))

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.id).toBe(validSessionId)

    expect(mockDataAccess.findSessionById)
      .toHaveBeenCalledWith(validSessionId)
  })
})
