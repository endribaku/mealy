// context/request-context.ts
import { AsyncLocalStorage } from 'node:async_hooks'

interface RequestContext {
  correlationId: string
}

export const requestContext = new AsyncLocalStorage<RequestContext>()
