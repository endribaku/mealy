import request from 'supertest'
import { createIntegrationApp } from '../utils/create-integration-app'
import { API_PREFIX, ROUTE_SEGMENTS } from '../../../src/routes/routes.constants'

import {
  IDataAccess,
  IContextBuilder,
  IMealPlanGenerator
} from '@mealy/engine'

describe('DELETE /api/users/me (Integration)', () => {

  let app: any
  let mockDataAccess: jest.Mocked<IDataAccess>
  let mockContextBuilder: jest.Mocked<IContextBuilder>
  let mockGenerator: jest.Mocked<IMealPlanGenerator>

  const validUserId = '550e8400-e29b-41d4-a716-446655440000'

  const fakeUser = {
    id: validUserId,
    email: 'test@example.com'
  } as any

  const endpoint = () =>
    `${API_PREFIX}/${ROUTE_SEGMENTS.USERS}/${ROUTE_SEGMENTS.ME}`

  beforeEach(() => {

    mockDataAccess = {
      findUserById: jest.fn(),
      deleteUser: jest.fn()
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

  it('returns 404 if user does not exist', async () => {

    mockDataAccess.findUserById.mockResolvedValue(null)

    const res = await request(app)
      .delete(endpoint())

    expect(res.status).toBe(404)
  })

  it('returns 500 if delete throws unknown error', async () => {

    mockDataAccess.findUserById.mockResolvedValue(fakeUser)
    mockDataAccess.deleteUser.mockRejectedValue(
      new Error('Database failure')
    )

    const res = await request(app)
      .delete(endpoint())

    expect(res.status).toBe(500)
  })

  it('deletes user successfully', async () => {

    mockDataAccess.findUserById.mockResolvedValue(fakeUser)
    mockDataAccess.deleteUser.mockResolvedValue(true)

    const res = await request(app)
      .delete(endpoint())

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toEqual({ deleted: true })

    expect(mockDataAccess.deleteUser)
      .toHaveBeenCalledWith(validUserId)
  })

})
