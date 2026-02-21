import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RouteProp } from '@react-navigation/native'
import type { MainStackParamList } from '../navigation/types'

type Nav = NativeStackNavigationProp<MainStackParamList, 'PlanSuccess'>
type Route = RouteProp<MainStackParamList, 'PlanSuccess'>

export function PlanSuccessScreen() {
  const navigation = useNavigation<Nav>()
  const route = useRoute<Route>()
  const { startDate } = route.params

  const goToCalendar = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: 'Tabs',
            state: {
              index: 1,
              routes: [{ name: 'Today' }, { name: 'Calendar' }, { name: 'Profile' }],
            },
          },
        ],
      })
    )
  }

  const goToHome = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Tabs' }],
      })
    )
  }

  return (
    <View className="flex-1 bg-white justify-center items-center px-8">
      <Text className="text-5xl mb-4">✓</Text>
      <Text className="text-2xl font-bold mb-2">Your meal plan is set!</Text>
      <Text className="text-sm text-gray-400 mb-8">Starts on {startDate}</Text>

      <TouchableOpacity
        className="bg-primary py-4 px-8 rounded-xl mb-3 w-full items-center"
        onPress={goToCalendar}
      >
        <Text className="text-white text-base font-semibold">View in Calendar</Text>
      </TouchableOpacity>

      <TouchableOpacity className="py-3" onPress={goToHome}>
        <Text className="text-primary text-sm">Back to Home</Text>
      </TouchableOpacity>
    </View>
  )
}
