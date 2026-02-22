export type AuthStackParamList = {
  Login: undefined
  SignUp: undefined
}

export type OnboardingStackParamList = {
  Welcome: undefined
  Diet: undefined
  Goals: undefined
  Body: undefined
  Cooking: undefined
  Restrictions: undefined
  Cuisine: undefined
  OnboardingComplete: undefined
}

export type TabParamList = {
  Today: undefined
  Calendar: undefined
  Profile: undefined
}

export type MainStackParamList = {
  Tabs: undefined
  Generating: { startDate: string }
  PlanReview: { sessionId: string; startDate: string }
  RegenerateMeal: { sessionId: string; mealId: string; mealName: string }
  RegenerateFull: { sessionId: string }
  PlanSuccess: { startDate: string }
  MealDetail: { planId: string; dayNumber: number; mealType: 'breakfast' | 'lunch' | 'dinner' }
  PlanHistory: undefined
  PlanDetail: { planId: string }
  EditProfile: undefined
  EditPreferences: undefined
  EditRestrictions: undefined
}
