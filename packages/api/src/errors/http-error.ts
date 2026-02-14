export class HttpError extends Error {
	public readonly statusCode: number
	public readonly isOperational: boolean

	constructor(message: string, statusCode: number = 500) {
		super(message)
		this.statusCode = statusCode
		this.isOperational = true
		Error.captureStackTrace(this, this.constructor)
	}
}
