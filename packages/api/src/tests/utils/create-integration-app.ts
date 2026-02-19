import { createApp } from '../../../src/app/create-app'
import {
  IDataAccess,
  IContextBuilder,
  IMealPlanGenerator
} from '@mealy/engine'

interface IntegrationAppDeps {
  dataAccess: IDataAccess
  contextBuilder: IContextBuilder
  generator: IMealPlanGenerator
  testUser: { id: string }
}

export function createIntegrationApp({
  dataAccess,
  contextBuilder,
  generator,
  testUser
}: IntegrationAppDeps) {

  return createApp({
    dataAccess,
    contextBuilder,
    generator,
    enableAuth: false,
    enableLogging: false,
    testUser,
  })
}
