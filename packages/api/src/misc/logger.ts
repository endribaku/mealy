import pino from 'pino'
import { requestContext } from './request-context'

export const baseLogger = pino({
  level: process.env.LOG_LEVEL ?? 'info'
})

function withContext(data: object) {
  const ctx = requestContext.getStore()
  return {
    ...data,
    correlationId: ctx?.correlationId
  }
}

export const logger = {
  info: (data: object) => baseLogger.info(withContext(data)),
  warn: (data: object) => baseLogger.warn(withContext(data)),
  error: (data: object) => baseLogger.error(withContext(data))
}
