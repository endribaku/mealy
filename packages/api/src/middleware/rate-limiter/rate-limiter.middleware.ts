import rateLimit, { ipKeyGenerator } from 'express-rate-limit'

export function createRateLimiter(options?: {
  windowMs?: number
  max?: number
  message?: string
}) {
  return rateLimit({
    windowMs: options?.windowMs ?? 15 * 60 * 1000,
    max: options?.max ?? 100,
    standardHeaders: true,
    legacyHeaders: false,

    keyGenerator: (req) => {
      return ipKeyGenerator(req.ip!)
    },

    message: {
      success: false,
      message: options?.message ?? 'Too many requests'
    }
  })
}
