import type { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { HttpError } from '../../errors/http-error'
import { logger } from '../../misc/logger'

export const globalErrorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const isProduction = process.env.NODE_ENV === 'production'

  // Log full structured error
  logger.error({
    type: err instanceof Error ? err.name : 'UnknownError',
    message: err instanceof Error ? err.message : 'Unknown error',
    stack: !isProduction && err instanceof Error ? err.stack : undefined,
    method: req.method,
    path: req.originalUrl
  })

  // Known operational error
  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    })
  }

  // Validation error
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.issues
    })
  }

  // Unknown error (programmer error or unexpected crash)
  return res.status(500).json({
    success: false,
    message: isProduction
      ? 'Internal server error'
      : err instanceof Error
        ? err.message
        : 'Internal server error'
  })
}

export const notFoundHandler = (
  req: Request,
  res: Response
) => {
  logger.warn({
    event: 'route_not_found',
    method: req.method,
    path: req.originalUrl
  })

  return res.status(404).json({
    success: false,
    message: 'Route not found'
  })
}
