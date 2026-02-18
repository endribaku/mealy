import { requestContext } from '../../misc/request-context'
import { randomUUID } from 'crypto'
import type { RequestHandler } from 'express'

export const correlationIdMiddleware: RequestHandler = (
  req,
  res,
  next
) => {
  const id = (req.headers['x-request-id'] as string) ?? randomUUID()

  requestContext.run({ correlationId: id }, () => {
    res.setHeader('x-request-id', id)
    next()
  })
}
