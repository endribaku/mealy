import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { TabNavigator } from './TabNavigator'
import { GeneratingScreen } from '../screens/GeneratingScreen'
import { PlanReviewScreen } from '../screens/PlanReviewScreen'
import { RegenerateMealScreen } from '../screens/RegenerateMealScreen'
import { RegenerateFullScreen } from '../screens/RegenerateFullScreen'
import { PlanSuccessScreen } from '../screens/PlanSuccessScreen'
import type { MainStackParamList } from './types'

const Stack = createNativeStackNavigator<MainStackParamList>()

export function MainStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Tabs"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Generating"
        component={GeneratingScreen}
        options={{
          title: '',
          headerBackVisible: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="PlanReview"
        component={PlanReviewScreen}
        options={{ title: 'Review Plan' }}
      />
      <Stack.Screen
        name="RegenerateMeal"
        component={RegenerateMealScreen}
        options={{ presentation: 'modal', title: 'Swap Meal' }}
      />
      <Stack.Screen
        name="RegenerateFull"
        component={RegenerateFullScreen}
        options={{ presentation: 'modal', title: 'Regenerate' }}
      />
      <Stack.Screen
        name="PlanSuccess"
        component={PlanSuccessScreen}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  )
}
