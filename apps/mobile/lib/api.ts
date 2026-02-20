import axios, { AxiosError } from 'axios'
import { supabase } from './supabase'
import { ApiError, ApiErrorResponse } from '../api/types'

const DEFAULT_TIMEOUT = 10_000
const AI_TIMEOUT = 60_000

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: DEFAULT_TIMEOUT,
})

// AI endpoints need a longer timeout (generation can take 30s+)
export const aiApi = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: AI_TIMEOUT,
})

// ============================================================
// AUTH TOKEN CACHE
// Avoids calling getSession() in the interceptor, which can
// deadlock with processLock when onAuthStateChange is active.
// ============================================================

let cachedAccessToken: string | null = null

supabase.auth.getSession().then(({ data }) => {
  cachedAccessToken = data.session?.access_token ?? null
})

supabase.auth.onAuthStateChange((_event, session) => {
  cachedAccessToken = session?.access_token ?? null
})

// ============================================================
// AUTH INTERCEPTOR (shared)
// ============================================================

function attachAuth(instance: typeof api) {
  instance.interceptors.request.use((config) => {
    if (cachedAccessToken) {
      config.headers.Authorization = `Bearer ${cachedAccessToken}`
    }
    return config
  })
}

attachAuth(api)
attachAuth(aiApi)

// ============================================================
// ERROR INTERCEPTOR (shared)
// ============================================================

function attachErrorHandler(instance: typeof api) {
  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiErrorResponse>) => {

      // Network error or timeout (no response from server)
      if (!error.response) {
        const message = error.code === 'ECONNABORTED'
          ? 'Request timed out'
          : error.code === 'ERR_CANCELED'
            ? 'Request was cancelled'
            : 'Network error'

        throw new ApiError(message, 0)
      }

      const { status, data } = error.response

      throw new ApiError(
        data?.message ?? 'Something went wrong',
        status,
        data?.errors
      )
    }
  )
}

attachErrorHandler(api)
attachErrorHandler(aiApi)
