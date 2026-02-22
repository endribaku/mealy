import request from 'supertest'
import { createIntegrationApp } from '../utils/create-integration-app'
import { API_PREFIX, ROUTE_SEGMENTS } from '../../../src/routes/routes.constants'

import {
  IDataAccess,
  IContextBuilder,
  IMealPlanGenerator
} from '@mealy/engine'

describe('POST /api/meal-plans/:sessionId/confirm (Integration)', () => {

  let app: any
  let mockDataAccess: jest.Mocked<IDataAccess>
  let mockContextBuilder: jest.Mocked<IContextBuilder>
  let mockGenerator: jest.Mocked<IMealPlanGenerator>

  const validUserId = '550e8400-e29b-41d4-a716-446655440000'
  const validSessionId = '8f14e45f-ea4e-4cde-b123-123456789abc'
  const validPlanId = '9f14e45f-ea4e-4cde-b123-123456789abc'

  const fakeSessionWithPlan = {
    id: validSessionId,
    userId: validUserId,
    currentMealPlan: { days: [] }
  } as any

  const fakeSessionWithoutPlan = {
    id: validSessionId,
    userId: validUserId,
    currentMealPlan: null
  } as any

  const savedPlan = {
    id: validPlanId,
    userId: validUserId,
    days: []
  } as any

  const endpoint = (sessionId: string) =>
  `${API_PREFIX}/${ROUTE_SEGMENTS.MEAL_PLANS}/${ROUTE_SEGMENTS.SESSIONS}/${sessionId}/${ROUTE_SEGMENTS.CONFIRM}`

  beforeEach(() => {

    mockDataAccess = {
      updateSessionStatus: jest.fn(),
      findUserById: jest.fn(),
      findSessionById: jest.fn(),
      saveMealPlan: jest.fn()
    } as any

    mockContextBuilder = {} as any
    mockGenerator = {} as any

    app = createIntegrationApp({
      dataAccess: mockDataAccess,
      contextBuilder: mockContextBuilder,
      generator: mockGenerator,
      testUser: {id: validUserId}
    })
  })

  it('returns 400 if params invalid', async () => {

    const res = await request(app)
      .post(endpoint('invalid-id'))

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('returns 404 if session not found', async () => {

    mockDataAccess.findSessionById.mockResolvedValue(null)

    const res = await request(app)
      .post(endpoint(validSessionId))
      .send({})

    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })

  it('returns 404 if user does not own session', async () => {

    mockDataAccess.findSessionById.mockResolvedValue({
      ...fakeSessionWithPlan,
      userId: 'another-user'
    })

    const res = await request(app)
      .post(endpoint(validSessionId))
      .send({})

    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })

  it('returns 400 if no meal plan to confirm', async () => {

    mockDataAccess.findSessionById.mockResolvedValue(fakeSessionWithoutPlan)

    const res = await request(app)
      .post(endpoint(validSessionId))
      .send({})

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('confirms meal plan successfully', async () => {

    const confirmedSession = {
      ...fakeSessionWithPlan,
      status: 'confirmed'
    }

    mockDataAccess.findSessionById
      .mockResolvedValueOnce(fakeSessionWithPlan)
      .mockResolvedValueOnce(confirmedSession)

    mockDataAccess.saveMealPlan.mockResolvedValue(savedPlan)

    mockDataAccess.updateSessionStatus = jest
      .fn()
      .mockResolvedValue(confirmedSession)

    const res = await request(app)
      .post(endpoint(validSessionId))
      .send({})

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)

    expect(res.body.data.session).toEqual(confirmedSession)

    expect(mockDataAccess.saveMealPlan)
      .toHaveBeenCalledWith(
        validUserId,
        fakeSessionWithPlan.currentMealPlan,
        undefined
      )

    expect(mockDataAccess.updateSessionStatus)
      .toHaveBeenCalledWith(validSessionId, 'confirmed')
  })

  it('confirms with startDate and passes it to saveMealPlan', async () => {

    const confirmedSession = {
      ...fakeSessionWithPlan,
      status: 'confirmed'
    }

    mockDataAccess.findSessionById
      .mockResolvedValueOnce(fakeSessionWithPlan)
      .mockResolvedValueOnce(confirmedSession)

    mockDataAccess.saveMealPlan.mockResolvedValue(savedPlan)
    ;(mockDataAccess as any).hasOverlappingMealPlan = jest.fn().mockResolvedValue(false)

    mockDataAccess.updateSessionStatus = jest
      .fn()
      .mockResolvedValue(confirmedSession)

    const res = await request(app)
      .post(endpoint(validSessionId))
      .send({ startDate: '2026-03-01' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)

    expect(mockDataAccess.saveMealPlan)
      .toHaveBeenCalledWith(
        validUserId,
        fakeSessionWithPlan.currentMealPlan,
        '2026-03-01'
      )
  })

  it('returns 400 for invalid startDate format', async () => {

    const res = await request(app)
      .post(endpoint(validSessionId))
      .send({ startDate: 'not-a-date' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('returns 409 when dates overlap', async () => {

    mockDataAccess.findSessionById.mockResolvedValue(fakeSessionWithPlan)
    ;(mockDataAccess as any).hasOverlappingMealPlan = jest.fn().mockResolvedValue(true)

    const res = await request(app)
      .post(endpoint(validSessionId))
      .send({ startDate: '2026-03-01' })

    expect(res.status).toBe(409)
    expect(res.body.success).toBe(false)
  })

  it('returns 409 when dates overlap and replaceConflicting is false', async () => {

    mockDataAccess.findSessionById.mockResolvedValue(fakeSessionWithPlan)
    ;(mockDataAccess as any).hasOverlappingMealPlan = jest.fn().mockResolvedValue(true)

    const res = await request(app)
      .post(endpoint(validSessionId))
      .send({ startDate: '2026-03-01', replaceConflicting: false })

    expect(res.status).toBe(409)
    expect(res.body.success).toBe(false)
  })

  it('deletes overlapping plans and confirms when replaceConflicting is true', async () => {

    const confirmedSession = {
      ...fakeSessionWithPlan,
      status: 'confirmed'
    }

    const overlappingPlan1 = { id: 'overlap-1', userId: validUserId } as any
    const overlappingPlan2 = { id: 'overlap-2', userId: validUserId } as any

    mockDataAccess.findSessionById
      .mockResolvedValueOnce(fakeSessionWithPlan)
      .mockResolvedValueOnce(confirmedSession)

    ;(mockDataAccess as any).hasOverlappingMealPlan = jest.fn().mockResolvedValue(true)
    ;(mockDataAccess as any).findMealPlansByDateRange = jest.fn().mockResolvedValue([overlappingPlan1, overlappingPlan2])
    ;(mockDataAccess as any).deleteMealPlan = jest.fn().mockResolvedValue(true)

    mockDataAccess.saveMealPlan.mockResolvedValue(savedPlan)
    mockDataAccess.updateSessionStatus = jest.fn().mockResolvedValue(confirmedSession)

    const res = await request(app)
      .post(endpoint(validSessionId))
      .send({ startDate: '2026-03-01', replaceConflicting: true })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)

    expect((mockDataAccess as any).findMealPlansByDateRange).toHaveBeenCalledWith(
      validUserId,
      '2026-03-01',
      expect.any(String)
    )
    expect((mockDataAccess as any).deleteMealPlan).toHaveBeenCalledWith('overlap-1')
    expect((mockDataAccess as any).deleteMealPlan).toHaveBeenCalledWith('overlap-2')

    expect(mockDataAccess.saveMealPlan).toHaveBeenCalledWith(
      validUserId,
      fakeSessionWithPlan.currentMealPlan,
      '2026-03-01'
    )
  })

})
