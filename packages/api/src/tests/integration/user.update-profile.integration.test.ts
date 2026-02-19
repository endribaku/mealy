import request from 'supertest'
import { createApp } from '../../../src/app/create-app'
import { API_PREFIX, ROUTE_SEGMENTS } from '../../../src/routes/routes.constants'

import {
  IDataAccess,
  IContextBuilder,
  IMealPlanGenerator
} from '@mealy/engine'

describe('PATCH /api/users/me/restrictions (Integration)', () => {

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
    `${API_PREFIX}/${ROUTE_SEGMENTS.USERS}/${ROUTE_SEGMENTS.ME}/${ROUTE_SEGMENTS.RESTRICTIONS}`

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
      generator: mockGenerator,
      enableAuth: false,
      testUser: { id: validUserId }
    })
  })

  it('returns 400 if body invalid', async () => {

    const res = await request(app)
      .patch(endpoint())
      .send({ vegetarian: 'yes' })

    expect(res.status).toBe(400)
  })

  it('returns 404 if user does not exist', async () => {

    mockDataAccess.findUserById.mockResolvedValue(null)

    const res = await request(app)
      .patch(endpoint())
      .send({ vegetarian: true })

    expect(res.status).toBe(404)
  })

  it('returns 500 if service throws unknown error', async () => {

    mockDataAccess.findUserById.mockResolvedValue(fakeUser)
    mockDataAccess.updateDietaryRestrictions.mockRejectedValue(
      new Error('Database failure')
    )

    const res = await request(app)
      .patch(endpoint())
      .send({ vegetarian: true })

    expect(res.status).toBe(500)
  })

  it('updates dietary restrictions successfully', async () => {

    mockDataAccess.findUserById.mockResolvedValue(fakeUser)
    mockDataAccess.updateDietaryRestrictions.mockResolvedValue(fakeUser)

    const res = await request(app)
      .patch(endpoint())
      .send({ vegetarian: true })

    expect(res.status).toBe(200)

    expect(mockDataAccess.updateDietaryRestrictions)
      .toHaveBeenCalledWith(validUserId, {
        vegetarian: true
      })
  })

})
