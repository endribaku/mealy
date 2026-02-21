import React, { useEffect, useRef } from 'react'
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useMutation } from '@tanstack/react-query'
import { generateMealPlan } from '../api/mealPlans'
import type { MainStackParamList } from '../navigation/types'

type Nav = NativeStackNavigationProp<MainStackParamList, 'Generating'>

export function GeneratingScreen() {
  const navigation = useNavigation<Nav>()
  const hasStarted = useRef(false)

  const mutation = useMutation({
    mutationFn: () => generateMealPlan(),
    onSuccess: (data) => {
      navigation.replace('PlanReview', { sessionId: data.session.id })
    },
  })

  useEffect(() => {
    if (!hasStarted.current) {
      hasStarted.current = true
      mutation.mutate()
    }
  }, [])

  return (
    <View className="flex-1 bg-white justify-center items-center px-8">
      {mutation.isPending ? (
        <>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text className="text-lg font-semibold mt-6">Creating your meal plan...</Text>
          <Text className="text-sm text-gray-400 mt-2 text-center">
            This can take up to 30 seconds
          </Text>
        </>
      ) : mutation.isError ? (
        <>
          <Text className="text-lg font-semibold text-red-500 mb-2">Something went wrong</Text>
          <Text className="text-sm text-gray-500 text-center mb-6">
            {mutation.error?.message ?? 'Failed to generate meal plan'}
          </Text>
          <TouchableOpacity
            className="bg-primary py-3 px-8 rounded-xl mb-3"
            onPress={() => mutation.mutate()}
          >
            <Text className="text-white text-base font-semibold">Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text className="text-primary text-sm">Go Back</Text>
          </TouchableOpacity>
        </>
      ) : null}
    </View>
  )
}
