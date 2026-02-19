import { SupabaseDataAccess } from '@mealy/data'
import { ContextBuilder, MealPlanGenerator } from '@mealy/engine'
import { createApp } from './create-app'

export function createProductionApp() {

  const dataAccess = new SupabaseDataAccess()
  const contextBuilder = new ContextBuilder()
  const generator = new MealPlanGenerator()

  return createApp({
    dataAccess,
    contextBuilder,
    generator,
    corsOrigin: process.env.CORS_ORIGIN,
    enableAuth: true,
    enableLogging: true
  })
}
