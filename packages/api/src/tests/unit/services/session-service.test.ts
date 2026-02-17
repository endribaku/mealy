import { SessionService } from '../../../../src/services/session.service'
import { IDataAccess } from '@mealy/engine'

describe('SessionService', () => {

  let mockDataAccess: jest.Mocked<IDataAccess>
  let service: SessionService

  const fakeSession = {
    id: 's1',
    userId: 'u1'
  } as any

  beforeEach(() => {
    mockDataAccess = {
      findSessionById: jest.fn(),
      deleteSession: jest.fn()
    } as any

    service = new SessionService(mockDataAccess)
  })

  // ============================================================
  // getById
  // ============================================================

  describe('getById', () => {

    it('throws if session does not exist (null case)', async () => {
      mockDataAccess.findSessionById.mockResolvedValue(null)

      await expect(
        service.getById('u1', 's1')
      ).rejects.toThrow('Session not found')
    })

    it('throws if session belongs to another user (ownership case)', async () => {
      mockDataAccess.findSessionById.mockResolvedValue({
        id: 's1',
        userId: 'other'
      } as any)

      await expect(
        service.getById('u1', 's1')
      ).rejects.toThrow('Session not found')
    })

    it('returns session when valid (happy path)', async () => {
      mockDataAccess.findSessionById.mockResolvedValue(fakeSession)

      const result = await service.getById('u1', 's1')

      expect(result).toBe(fakeSession)
    })
  })

  // ============================================================
  // delete
  // ============================================================

  describe('delete', () => {

    it('throws if session invalid (delegates to getById)', async () => {
      mockDataAccess.findSessionById.mockResolvedValue(null)

      await expect(
        service.delete('u1', 's1')
      ).rejects.toThrow('Session not found')

      expect(mockDataAccess.deleteSession).not.toHaveBeenCalled()
    })

    it('deletes session successfully (happy path)', async () => {
      mockDataAccess.findSessionById.mockResolvedValue(fakeSession)

      const result = await service.delete('u1', 's1')

      expect(mockDataAccess.deleteSession)
        .toHaveBeenCalledWith('s1')

      expect(result).toBe(true)
    })

  })

})
