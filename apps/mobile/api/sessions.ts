import { api } from '../lib/api'
import { ApiResponse } from './types'

export type Session = {
  id: string
  createdAt: string
  // add more once you know full shape
}

export async function getSessionById(sessionId: string) {
  const res = await api.get<ApiResponse<Session>>(
    `/sessions/${sessionId}`
  )

  return res.data.data
}

export async function deleteSession(sessionId: string) {
  await api.delete(`/sessions/${sessionId}`)
}
