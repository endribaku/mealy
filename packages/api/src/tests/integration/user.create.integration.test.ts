import request from 'supertest'
import { createApp } from '../../app/create-app'
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

  beforeEach(() => {

    mockDataAccess = {
      createUser: jest.fn()
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
  // 1️⃣ Validation Failure — Missing Body
  // ============================================================

  it('returns 400 if body missing required fields', async () => {

    const res = await request(app)
      .post('/api/users')
      .send({})

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  // ============================================================
  // 2️⃣ Validation Failure — Invalid Email
  // ============================================================

  it('returns 400 if email invalid', async () => {

    const res = await request(app)
      .post('/api/users')
      .send({
        email: 'not-an-email',
        profile: { name: 'John' }
      })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  // ============================================================
  // 3️⃣ Strict Mode Rejection — Unknown Field
  // ============================================================

  it('returns 400 if body contains unknown fields', async () => {

    const res = await request(app)
      .post('/api/users')
      .send({
        ...validBody,
        unknownField: true
      })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  // ============================================================
  // 4️⃣ Service Throws Unexpected Error
  // ============================================================

  it('returns 500 if service throws unexpected error', async () => {

    mockDataAccess.createUser.mockRejectedValue(
      new Error('Database failure')
    )

    const res = await request(app)
      .post('/api/users')
      .send(validBody)

    expect(res.status).toBe(500)
    expect(res.body.success).toBe(false)
  })

  // ============================================================
  // 5️⃣ Happy Path
  // ============================================================

  it('creates user successfully', async () => {

    mockDataAccess.createUser.mockResolvedValue(fakeUser)

    const res = await request(app)
      .post('/api/users')
      .send(validBody)

    // HTTP
    expect(res.status).toBe(201)

    // JSON structure
    expect(res.body.success).toBe(true)
    expect(res.body.data).toBeDefined()
    expect(res.body.data.email).toBe(validEmail)

    // Service execution verification
    expect(mockDataAccess.createUser)
      .toHaveBeenCalledWith(validBody)
  })

})
