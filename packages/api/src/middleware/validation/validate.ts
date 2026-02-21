import { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'

type RequestProperty = 'body' | 'params' | 'query'

export function validate<T>(
  schema: ZodSchema<T>,
  property: RequestProperty
) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {

      const parsed = schema.parse(req[property])

      // Replace request data with validated & typed data
      // Note: req.query is read-only in Express 5, so skip reassignment for query
      if (property !== 'query') {
        req[property] = parsed as any
      }

      next()

    } catch (error) {
      next(error) // 🔥 send to globalErrorHandler
    }
  }
}
