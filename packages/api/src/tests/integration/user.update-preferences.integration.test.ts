import request from 'supertest'
import { createIntegrationApp } from '../utils/create-integration-app'
import { API_PREFIX, ROUTE_SEGMENTS } from '../../../src/routes/routes.constants'

import {
  IDataAccess,
  IContextBuilder,
  IMealPlanGenerator
} from '@mealy/engine'

describe('PATCH /api/users/me/preferences (Integration)', () => {

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
    `${API_PREFIX}/${ROUTE_SEGMENTS.USERS}/${ROUTE_SEGMENTS.ME}/${ROUTE_SEGMENTS.PREFERENCES}`

  beforeEach(() => {

    mockDataAccess = {
      findUserById: jest.fn(),
      updateLearnedPreferences: jest.fn()
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

  it('returns 400 if body invalid', async () => {

    const res = await request(app)
      .patch(endpoint())
      .send({ favoriteCuisines: 'not-an-array' })

    expect(res.status).toBe(400)
  })

  it('returns 404 if user does not exist', async () => {

    mockDataAccess.findUserById.mockResolvedValue(null)

    const res = await request(app)
      .patch(endpoint())
      .send({ favoriteCuisines: ['italian'] })

    expect(res.status).toBe(404)
  })

  it('returns 500 if service throws unknown error', async () => {

    mockDataAccess.findUserById.mockResolvedValue(fakeUser)
    mockDataAccess.updateLearnedPreferences.mockRejectedValue(
      new Error('Database failure')
    )

    const res = await request(app)
      .patch(endpoint())
      .send({ favoriteCuisines: ['italian'] })

    expect(res.status).toBe(500)
  })

  it('updates preferences successfully', async () => {

    mockDataAccess.findUserById.mockResolvedValue(fakeUser)
    mockDataAccess.updateLearnedPreferences.mockResolvedValue(fakeUser)

    const res = await request(app)
      .patch(endpoint())
      .send({ favoriteCuisines: ['italian'] })

    expect(res.status).toBe(200)

    expect(mockDataAccess.updateLearnedPreferences)
      .toHaveBeenCalledWith(validUserId, {
        favoriteCuisines: ['italian']
      })
  })

})
