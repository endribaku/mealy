import { api } from '../lib/api'
import {
  ApiResponse,
  User,
  CreateUserRequest,
  UpdateProfileRequest,
  UpdatePreferencesRequest,
  UpdateRestrictionsRequest
} from './types'

// POST /users
export async function createUser(body: CreateUserRequest) {
  const res = await api.post<ApiResponse<User>>(
    '/users',
    body
  )

  return res.data.data
}

// GET /users/me
export async function getCurrentUser(signal?: AbortSignal) {
  const res = await api.get<ApiResponse<User>>(
    '/users/me',
    { signal }
  )

  return res.data.data
}

// PATCH /users/me/profile
export async function updateProfile(body: UpdateProfileRequest) {
  const res = await api.patch<ApiResponse<User>>(
    '/users/me/profile',
    body
  )

  return res.data.data
}

// PATCH /users/me/preferences
export async function updatePreferences(body: UpdatePreferencesRequest) {
  const res = await api.patch<ApiResponse<User>>(
    '/users/me/preferences',
    body
  )

  return res.data.data
}

// PATCH /users/me/restrictions
export async function updateRestrictions(body: UpdateRestrictionsRequest) {
  const res = await api.patch<ApiResponse<User>>(
    '/users/me/restrictions',
    body
  )

  return res.data.data
}

// DELETE /users/me
export async function deleteCurrentUser() {
  const res = await api.delete<ApiResponse<{ deleted: true }>>(
    '/users/me'
  )

  return res.data.data
}
