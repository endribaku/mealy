import { IDataAccess } from '@mealy/engine'
import { HttpError } from '../errors/http-error'

import {
	UserProfileUpdate,
	LearnedPreferencesUpdate,
	DietaryRestrictionsUpdate,
} from '@mealy/engine'

export class UserService {

	private readonly dataAccess: IDataAccess

	constructor(dataAccess: IDataAccess) {
		this.dataAccess = dataAccess
	}

	// ============================================================
	// GET USER
	// ============================================================

	async getById(userId: string) {
		const user = await this.dataAccess.findUserById(userId)

		if (!user) {
			throw new HttpError('User not found', 404)
		}

		return user
	}

	async getByEmail(email: string) {
		const user = await this.dataAccess.findUserByEmail(email)

		if (!user) {
			throw new HttpError('User not found', 404)
		}

		return user
	}

	// ============================================================
	// CREATE USER
	// ============================================================

	async create(userInput: Parameters<IDataAccess['createUser']>[0], id?: string) {
		return this.dataAccess.createUser(userInput, id)
	}

	// ============================================================
	// UPDATE PROFILE
	// ============================================================

	async updateProfile(
		userId: string,
		updates: UserProfileUpdate
	) {
		// Ensure user exists first
		await this.getById(userId)

		return this.dataAccess.updateUserProfile(
			userId,
			updates
		)
	}

	// ============================================================
	// UPDATE LEARNED PREFERENCES
	// ============================================================

	async updatePreferences(
		userId: string,
		updates: LearnedPreferencesUpdate
	) {
		await this.getById(userId)

		return this.dataAccess.updateLearnedPreferences(
			userId,
			updates
		)
	}

	// ============================================================
	// UPDATE DIETARY RESTRICTIONS
	// ============================================================

	async updateRestrictions(
		userId: string,
		updates: DietaryRestrictionsUpdate
	) {
		await this.getById(userId)

		return this.dataAccess.updateDietaryRestrictions(
			userId,
			updates
		)
	}

	// ============================================================
	// DELETE USER
	// ============================================================

	async delete(userId: string) {
		await this.getById(userId)

		await this.dataAccess.deleteUser(userId)

		return true
	}
}
