import { IDataAccess } from '@mealy/engine'
import { HttpError } from '../errors/http-error'

export class SessionService {

	private readonly dataAccess: IDataAccess

	constructor(dataAccess: IDataAccess) {
		this.dataAccess = dataAccess
	}

	async getById(userId: string, sessionId: string) {

		const session = await this.dataAccess.findSessionById(sessionId)

		if (!session || session.userId !== userId) {
			throw new HttpError('Session not found', 404)
		}

		return session
	}

	async delete(userId: string, sessionId: string) {

		await this.getById(userId, sessionId)

		await this.dataAccess.deleteSession(sessionId)

		return true
	}
}
