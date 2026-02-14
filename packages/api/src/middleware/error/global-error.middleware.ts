import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { HttpError } from '../../errors/http-error'

export function globalErrorHandler(
	err: unknown,
	req: Request,
	res: Response,
	next: NextFunction
) {

	const isProduction = process.env.NODE_ENV === 'production'

	// Structured logging
	console.error({
		level: 'error',
		method: req.method,
		path: req.originalUrl,
		message: err instanceof Error ? err.message : 'Unknown error',
		stack: !isProduction && err instanceof Error ? err.stack : undefined,
		timestamp: new Date().toISOString()
	})

	// Known operational error
	if (err instanceof HttpError) {
		return res.status(err.statusCode).json({
			success: false,
			message: err.message
		})
	}

	// Zod validation error
	if (err instanceof ZodError) {
		return res.status(400).json({
			success: false,
			message: 'Validation failed',
			errors: err
		})
	}

	// Unknown error
	return res.status(500).json({
		success: false,
		message: 'Internal server error'
	})
}

export function notFoundHandler(
	req: Request,
	res: Response
) {
	return res.status(404).json({
		success: false,
		message: 'Route not found'
	})
}
