import { useMutation } from '@tanstack/react-query'
import { createUser, updateProfile, updatePreferences } from '../api/users'
import type { OnboardingData } from '../types/onboarding'
import type { User, UpdatePreferencesRequest } from '../api/types'
import { ApiError } from '../api/types'

type SubmitParams = {
  data: OnboardingData
  email: string
  name: string
}

export function useSubmitOnboarding() {
  return useMutation({
    mutationFn: async ({ data, email, name }: SubmitParams): Promise<User> => {
      const profileData = {
        name,
        diet: data.diet ?? undefined,
        calorieTarget: data.calorieTarget ?? undefined,
        cookingSkill: data.cookingSkill ?? undefined,
        householdSize: data.householdSize,
        measurementSystem: data.measurementSystem,
        goals: data.goals.length > 0 ? data.goals : undefined,
      }

      let user: User
      try {
        user = await createUser({ email, profile: profileData })
      } catch (error) {
        // User already exists (duplicate key) — update profile instead
        if (error instanceof ApiError && error.isServer) {
          user = await updateProfile(profileData)
        } else {
          throw error
        }
      }

      // Update learned preferences (separate endpoint)
      const preferencesPayload: UpdatePreferencesRequest = {}
      if (data.spiceLevel) preferencesPayload.spiceLevel = data.spiceLevel
      if (data.preferredComplexity) preferencesPayload.preferredComplexity = data.preferredComplexity
      if (data.favoriteCuisines.length > 0) preferencesPayload.favoriteCuisines = data.favoriteCuisines

      if (Object.keys(preferencesPayload).length > 0) {
        await updatePreferences(preferencesPayload)
      }

      return user
    },
  })
}
