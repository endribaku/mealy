import pinoHttp from 'pino-http'
import { baseLogger } from '../../misc/logger'
import { requestContext } from '../../misc/request-context'

export const httpLogger = pinoHttp({
  logger: baseLogger,
  customLogLevel: (_req, res, err) => {
    if (res.statusCode >= 500 || err) return 'error'
    if (res.statusCode >= 400) return 'warn'
    return 'info'
  },
  customProps: () => {
    const ctx = requestContext.getStore()
    return {
      correlationId: ctx?.correlationId
    }
  }
})
