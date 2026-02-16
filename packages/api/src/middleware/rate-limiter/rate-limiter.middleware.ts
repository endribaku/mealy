import rateLimit from 'express-rate-limit'
import { Request } from 'express'

// Generic limiter factory
export function createRateLimiter(options?: {
	windowMs?: number
	max?: number
	message?: string
}) {

	return rateLimit({
		windowMs: options?.windowMs ?? 15 * 60 * 1000, // 15 min
		max: options?.max ?? 100, // 100 requests per window
		standardHeaders: true,
		legacyHeaders: false,

		keyGenerator: (req: Request) => {
			return req.ip ?? 'unknown'
		},

		handler: (req, res) => {
			res.status(429).json({
				success: false,
				message:
					options?.message ??
					'Too many requests, please try again later.'
			})
		}
	})
}
