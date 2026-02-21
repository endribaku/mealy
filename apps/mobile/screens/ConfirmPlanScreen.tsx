import React from 'react'
import { Alert } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RouteProp } from '@react-navigation/native'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { confirmSession } from '../api/mealPlans'
import { StartDatePicker } from '../components/StartDatePicker'
import type { MainStackParamList } from '../navigation/types'
import type { ApiError } from '../api/types'

type Nav = NativeStackNavigationProp<MainStackParamList, 'ConfirmPlan'>
type Route = RouteProp<MainStackParamList, 'ConfirmPlan'>

export function ConfirmPlanScreen() {
  const navigation = useNavigation<Nav>()
  const route = useRoute<Route>()
  const queryClient = useQueryClient()
  const { sessionId, numberOfDays } = route.params

  const mutation = useMutation({
    mutationFn: (startDate: string) => confirmSession(sessionId, startDate),
    onSuccess: (_data, startDate) => {
      queryClient.invalidateQueries({ queryKey: ['meal-plans'] })
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
      navigation.replace('PlanSuccess', { startDate })
    },
    onError: (error: ApiError) => {
      if (error.status === 409) {
        Alert.alert('Date Conflict', 'These dates overlap with an existing meal plan. Please choose different dates.')
      } else {
        Alert.alert('Error', error.message ?? 'Failed to confirm plan')
      }
    },
  })

  return (
    <StartDatePicker
      numberOfDays={numberOfDays}
      onConfirm={(startDate) => mutation.mutate(startDate)}
      isPending={mutation.isPending}
    />
  )
}
