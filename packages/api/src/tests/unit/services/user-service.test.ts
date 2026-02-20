import { UserService } from '../../../../src/services/user.service'
import { IDataAccess } from '@mealy/engine'

describe('UserService', () => {

  let mockDataAccess: jest.Mocked<IDataAccess>
  let service: UserService

  const fakeUser = {
    id: 'u1',
    email: 'test@test.com'
  } as any

  beforeEach(() => {

    mockDataAccess = {
      findUserById: jest.fn(),
      findUserByEmail: jest.fn(),
      createUser: jest.fn(),
      updateUserProfile: jest.fn(),
      updateLearnedPreferences: jest.fn(),
      updateDietaryRestrictions: jest.fn(),
      deleteUser: jest.fn()
    } as any

    service = new UserService(mockDataAccess)
  })

  // ============================================================
  // GET BY ID
  // ============================================================

  describe('getById', () => {

    it('throws if user does not exist', async () => {
      mockDataAccess.findUserById.mockResolvedValue(null)

      await expect(
        service.getById('u1')
      ).rejects.toThrow('User not found')
    })

    it('returns user when found', async () => {
      mockDataAccess.findUserById.mockResolvedValue(fakeUser)

      const result = await service.getById('u1')

      expect(result).toBe(fakeUser)
    })
  })

  // ============================================================
  // GET BY EMAIL
  // ============================================================

  describe('getByEmail', () => {

    it('throws if user not found', async () => {
      mockDataAccess.findUserByEmail.mockResolvedValue(null)

      await expect(
        service.getByEmail('test@test.com')
      ).rejects.toThrow('User not found')
    })

    it('returns user when found', async () => {
      mockDataAccess.findUserByEmail.mockResolvedValue(fakeUser)

      const result = await service.getByEmail('test@test.com')

      expect(result).toBe(fakeUser)
    })
  })

  // ============================================================
  // CREATE
  // ============================================================

  describe('create', () => {

    it('creates user successfully', async () => {
      mockDataAccess.createUser.mockResolvedValue(fakeUser)

      const result = await service.create({ email: 'test@test.com' } as any)

      expect(mockDataAccess.createUser)
        .toHaveBeenCalledWith({ email: 'test@test.com' }, undefined)

      expect(result).toBe(fakeUser)
    })
  })

  // ============================================================
  // UPDATE PROFILE
  // ============================================================

  describe('updateProfile', () => {

    it('throws if user does not exist', async () => {
      mockDataAccess.findUserById.mockResolvedValue(null)

      await expect(
        service.updateProfile('u1', { name: 'New Name' } as any)
      ).rejects.toThrow('User not found')

      expect(mockDataAccess.updateUserProfile).not.toHaveBeenCalled()
    })

    it('updates profile successfully', async () => {
      mockDataAccess.findUserById.mockResolvedValue(fakeUser)
      mockDataAccess.updateUserProfile.mockResolvedValue(fakeUser)

      const result = await service.updateProfile(
        'u1',
        { name: 'New Name' } as any
      )

      expect(mockDataAccess.updateUserProfile)
        .toHaveBeenCalledWith('u1', { name: 'New Name' })

      expect(result).toBe(fakeUser)
    })
  })

  // ============================================================
  // UPDATE PREFERENCES
  // ============================================================

  describe('updatePreferences', () => {

    it('throws if user does not exist', async () => {
      mockDataAccess.findUserById.mockResolvedValue(null)

      await expect(
        service.updatePreferences('u1', { spiceLevel: 3 } as any)
      ).rejects.toThrow('User not found')

      expect(mockDataAccess.updateLearnedPreferences)
        .not.toHaveBeenCalled()
    })

    it('updates preferences successfully', async () => {
      mockDataAccess.findUserById.mockResolvedValue(fakeUser)
      mockDataAccess.updateLearnedPreferences.mockResolvedValue(fakeUser)

      const result = await service.updatePreferences(
        'u1',
        { spiceLevel: 3 } as any
      )

      expect(mockDataAccess.updateLearnedPreferences)
        .toHaveBeenCalledWith('u1', { spiceLevel: 3 })

      expect(result).toBe(fakeUser)
    })
  })

  // ============================================================
  // UPDATE RESTRICTIONS
  // ============================================================

  describe('updateRestrictions', () => {

    it('throws if user does not exist', async () => {
      mockDataAccess.findUserById.mockResolvedValue(null)

      await expect(
        service.updateRestrictions('u1', { vegetarian: true } as any)
      ).rejects.toThrow('User not found')

      expect(mockDataAccess.updateDietaryRestrictions)
        .not.toHaveBeenCalled()
    })

    it('updates restrictions successfully', async () => {
      mockDataAccess.findUserById.mockResolvedValue(fakeUser)
      mockDataAccess.updateDietaryRestrictions.mockResolvedValue(fakeUser)

      const result = await service.updateRestrictions(
        'u1',
        { vegetarian: true } as any
      )

      expect(mockDataAccess.updateDietaryRestrictions)
        .toHaveBeenCalledWith('u1', { vegetarian: true })

      expect(result).toBe(fakeUser)
    })
  })

  // ============================================================
  // DELETE
  // ============================================================

  describe('delete', () => {

    it('throws if user does not exist', async () => {
      mockDataAccess.findUserById.mockResolvedValue(null)

      await expect(
        service.delete('u1')
      ).rejects.toThrow('User not found')

      expect(mockDataAccess.deleteUser).not.toHaveBeenCalled()
    })

    it('deletes user successfully', async () => {
      mockDataAccess.findUserById.mockResolvedValue(fakeUser)

      const result = await service.delete('u1')

      expect(mockDataAccess.deleteUser)
        .toHaveBeenCalledWith('u1')

      expect(result).toBe(true)
    })
  })

})
