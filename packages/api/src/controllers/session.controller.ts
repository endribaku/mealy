import { Request, Response, NextFunction } from 'express'
import { SessionService } from '../services/session.service'
import { BasicSuccessResponse } from '../types/dto.types'
import { logger } from '../misc/logger'

export class SessionController {

	constructor(
		private readonly service: SessionService
	) {}

	// ============================================================
	// GET SESSION BY ID
	// GET /api/sessions/:sessionId
	// ============================================================

	async getById(
		req: Request<
			{ sessionId: string },
			BasicSuccessResponse<
				Awaited<ReturnType<SessionService['getById']>>
			>
		>,
		res: Response,
		next: NextFunction
	) {
		try {
			const userId = (req as any).user.id
			const { sessionId } = req.params

			const session = await this.service.getById(
				userId,
				sessionId
			)

			return res.json({
				success: true,
				data: session
			})

		} catch (error) {
			next(error)
		}
	}

	// ============================================================
	// DELETE SESSION
	// DELETE /api/sessions/:sessionId
	// ============================================================

	async delete(
		req: Request<
			{ sessionId: string },
			BasicSuccessResponse<{ deleted: true }>
		>,
		res: Response,
		next: NextFunction
	) {
		try {
			const userId = (req as any).user.id
			const { sessionId } = req.params

			logger.info({
				event: 'session_delete_requested',
				userId,
				sessionId
			})

			await this.service.delete(
				userId,
				sessionId
			)

			logger.info({
				event: 'session_delete_success',
				userId,
				sessionId
			})

			return res.json({
				success: true,
				data: { deleted: true }
			})

		} catch (error) {
			next(error)
		}
	}
}
