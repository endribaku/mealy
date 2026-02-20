import React, { createContext, useContext, useReducer, useCallback } from 'react'
import { OnboardingData, INITIAL_ONBOARDING_DATA } from '../types/onboarding'

type OnboardingAction =
  | { type: 'SET_FIELD'; field: keyof OnboardingData; value: any }
  | { type: 'RESET' }

function onboardingReducer(state: OnboardingData, action: OnboardingAction): OnboardingData {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value }
    case 'RESET':
      return INITIAL_ONBOARDING_DATA
    default:
      return state
  }
}

type OnboardingContextValue = {
  data: OnboardingData
  setField: <K extends keyof OnboardingData>(field: K, value: OnboardingData[K]) => void
  reset: () => void
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null)

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [data, dispatch] = useReducer(onboardingReducer, INITIAL_ONBOARDING_DATA)

  const setField = useCallback(<K extends keyof OnboardingData>(
    field: K,
    value: OnboardingData[K]
  ) => {
    dispatch({ type: 'SET_FIELD', field, value })
  }, [])

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' })
  }, [])

  return (
    <OnboardingContext.Provider value={{ data, setField, reset }}>
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding(): OnboardingContextValue {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider')
  }
  return context
}
