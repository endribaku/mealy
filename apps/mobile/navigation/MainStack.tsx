import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { HomeScreen } from '../screens/HomeScreen'
import { CalendarScreen } from '../screens/CalendarScreen'
import type { MainStackParamList } from './types'

const Stack = createNativeStackNavigator<MainStackParamList>()

export function MainStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Calendar" component={CalendarScreen} options={{ title: 'Meal Calendar' }} />
    </Stack.Navigator>
  )
}
