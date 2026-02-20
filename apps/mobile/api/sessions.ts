import { api } from '../lib/api'
import { ApiResponse, Session } from './types'

// GET /sessions/:sessionId
export async function getSessionById(sessionId: string, signal?: AbortSignal) {
  const res = await api.get<ApiResponse<Session>>(
    `/sessions/${sessionId}`,
    { signal }
  )

  return res.data.data
}

// DELETE /sessions/:sessionId
export async function deleteSession(sessionId: string) {
  const res = await api.delete<ApiResponse<{ deleted: true }>>(
    `/sessions/${sessionId}`
  )

  return res.data.data
}
