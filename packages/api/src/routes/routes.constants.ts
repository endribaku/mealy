export const API_VERSION = 'v1'

export const API_PREFIX = `/api/${API_VERSION}`

export const ROUTE_SEGMENTS = {
  USERS: 'users',
  SESSIONS: 'sessions',
  MEAL_PLANS: 'meal-plans',

  // generic param names
  SESSION_ID: 'sessionId',
  PLAN_ID: 'planId',

  // user sub-routes
  ME: 'me',
  PROFILE: 'profile',
  PREFERENCES: 'preferences',
  RESTRICTIONS: 'restrictions',

  // session actions
  REGENERATE: 'regenerate',
  REGENERATE_MEAL: 'regenerate-meal',
  CONFIRM: 'confirm'
} as const

