import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { OnboardingProvider } from '../contexts/OnboardingContext'
import { WelcomeScreen } from '../screens/onboarding/WelcomeScreen'
import { DietScreen } from '../screens/onboarding/DietScreen'
import { GoalsScreen } from '../screens/onboarding/GoalsScreen'
import { BodyScreen } from '../screens/onboarding/BodyScreen'
import { CookingScreen } from '../screens/onboarding/CookingScreen'
import { RestrictionsScreen } from '../screens/onboarding/RestrictionsScreen'
import { CuisineScreen } from '../screens/onboarding/CuisineScreen'
import { OnboardingCompleteScreen } from '../screens/onboarding/OnboardingCompleteScreen'
import type { OnboardingStackParamList } from './types'

const Stack = createNativeStackNavigator<OnboardingStackParamList>()

export function OnboardingStack() {
  return (
    <OnboardingProvider>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Diet" component={DietScreen} />
        <Stack.Screen name="Goals" component={GoalsScreen} />
        <Stack.Screen name="Body" component={BodyScreen} />
        <Stack.Screen name="Cooking" component={CookingScreen} />
        <Stack.Screen name="Restrictions" component={RestrictionsScreen} />
        <Stack.Screen name="Cuisine" component={CuisineScreen} />
        <Stack.Screen name="OnboardingComplete" component={OnboardingCompleteScreen} />
      </Stack.Navigator>
    </OnboardingProvider>
  )
}
