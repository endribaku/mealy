import request from 'supertest'
import { createIntegrationApp } from '../utils/create-integration-app'
import { API_PREFIX, ROUTE_SEGMENTS } from '../../routes/routes.constants'

import {
  IDataAccess,
  IContextBuilder,
  IMealPlanGenerator
} from '@mealy/engine'

describe('POST /api/users (Integration)', () => {

  let app: any
  let mockDataAccess: jest.Mocked<IDataAccess>
  let mockContextBuilder: jest.Mocked<IContextBuilder>
  let mockGenerator: jest.Mocked<IMealPlanGenerator>

  const validUserId = '550e8400-e29b-41d4-a716-446655440000'
  const validEmail = 'test@example.com'

  const validBody = {
    email: validEmail,
    profile: {
      name: 'John',
      diet: 'omnivore'
    }
  }

  const fakeUser = {
    id: validUserId,
    email: validEmail,
    profile: {
      name: 'John',
      diet: 'omnivore'
    }
  } as any

  const endpoint = () =>
    `${API_PREFIX}/${ROUTE_SEGMENTS.USERS}`

  beforeEach(() => {

    mockDataAccess = {
      createUser: jest.fn()
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

  it('returns 400 if body missing required fields', async () => {
    const res = await request(app).post(endpoint()).send({})
    expect(res.status).toBe(400)
  })

  it('returns 400 if email invalid', async () => {
    const res = await request(app)
      .post(endpoint())
      .send({
        email: 'not-an-email',
        profile: { name: 'John' }
      })

    expect(res.status).toBe(400)
  })

  it('returns 500 if service throws unexpected error', async () => {

    mockDataAccess.createUser.mockRejectedValue(
      new Error('Database failure')
    )

    const res = await request(app)
      .post(endpoint())
      .send(validBody)

    expect(res.status).toBe(500)
  })

  it('creates user successfully', async () => {

    mockDataAccess.createUser.mockResolvedValue(fakeUser)

    const res = await request(app)
      .post(endpoint())
      .send(validBody)

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.email).toBe(validEmail)

    expect(mockDataAccess.createUser)
      .toHaveBeenCalledWith(validBody)
  })
})
