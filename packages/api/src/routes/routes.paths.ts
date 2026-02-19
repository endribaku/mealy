import { API_PREFIX, ROUTE_SEGMENTS } from './routes.constants'

export const ROUTES = {
  USERS: {
    ROOT: `${API_PREFIX}/${ROUTE_SEGMENTS.USERS}`
  },

  SESSIONS: {
    ROOT: `${API_PREFIX}/${ROUTE_SEGMENTS.SESSIONS}`,
    BY_ID: (sessionId: string) =>
      `${API_PREFIX}/${ROUTE_SEGMENTS.SESSIONS}/${sessionId}`
  },

  MEAL_PLANS: {
    ROOT: `${API_PREFIX}/${ROUTE_SEGMENTS.MEAL_PLANS}`,
    BY_ID: (planId: string) =>
      `${API_PREFIX}/${ROUTE_SEGMENTS.MEAL_PLANS}/${planId}`,
    REGENERATE: (sessionId: string) =>
      `${API_PREFIX}/${ROUTE_SEGMENTS.SESSIONS}/${sessionId}/regenerate`,
    REGENERATE_SINGLE: (sessionId: string) =>
      `${API_PREFIX}/${ROUTE_SEGMENTS.SESSIONS}/${sessionId}/regenerate-meal`,
    CONFIRM: (sessionId: string) =>
      `${API_PREFIX}/${ROUTE_SEGMENTS.SESSIONS}/${sessionId}/confirm`
  }
} as const
