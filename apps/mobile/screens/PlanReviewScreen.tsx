import React from 'react'
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, SafeAreaView } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RouteProp } from '@react-navigation/native'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getSessionById } from '../api/sessions'
import { deleteSession } from '../api/sessions'
import type { MainStackParamList } from '../navigation/types'
import type { Day } from '../api/types'

type Nav = NativeStackNavigationProp<MainStackParamList, 'PlanReview'>
type Route = RouteProp<MainStackParamList, 'PlanReview'>

function MealRow({ label, meal, onSwap }: {
  label: string
  meal: { name: string; cuisine: string; prepTime: number; nutrition: { calories: number } }
  onSwap: () => void
}) {
  return (
    <View className="flex-row items-center bg-gray-50 rounded-xl p-4 mb-2">
      <View className="flex-1">
        <Text className="text-xs text-gray-400 uppercase tracking-wide">{label}</Text>
        <Text className="text-base font-semibold mt-1">{meal.name}</Text>
        <View className="flex-row mt-1">
          <Text className="text-xs text-gray-500">{meal.cuisine}</Text>
          <Text className="text-xs text-gray-400 mx-2">·</Text>
          <Text className="text-xs text-gray-500">{meal.prepTime} min</Text>
          <Text className="text-xs text-gray-400 mx-2">·</Text>
          <Text className="text-xs text-gray-500">{meal.nutrition.calories} cal</Text>
        </View>
      </View>
      <TouchableOpacity
        className="bg-gray-200 px-3 py-2 rounded-lg ml-3"
        onPress={onSwap}
      >
        <Text className="text-xs font-medium text-gray-600">Swap</Text>
      </TouchableOpacity>
    </View>
  )
}

export function PlanReviewScreen() {
  const navigation = useNavigation<Nav>()
  const route = useRoute<Route>()
  const { sessionId } = route.params

  const { data: session, isLoading } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: ({ signal }) => getSessionById(sessionId, signal),
  })

  const discardMutation = useMutation({
    mutationFn: () => deleteSession(sessionId),
    onSuccess: () => navigation.popToTop(),
  })

  const handleDiscard = () => {
    Alert.alert(
      'Discard Plan',
      'Are you sure? Your draft meal plan will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => discardMutation.mutate(),
        },
      ]
    )
  }

  const handleSwapMeal = (dayNumber: number, mealType: string, mealName: string) => {
    navigation.navigate('RegenerateMeal', {
      sessionId,
      mealId: `day-${dayNumber}-${mealType}`,
      mealName,
    })
  }

  const handleRegenerateAll = () => {
    navigation.navigate('RegenerateFull', { sessionId })
  }

  const handleConfirm = () => {
    if (!session?.currentMealPlan) return
    navigation.navigate('ConfirmPlan', {
      sessionId,
      numberOfDays: session.currentMealPlan.days.length,
    })
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    )
  }

  if (!session?.currentMealPlan) {
    return (
      <View className="flex-1 bg-white justify-center items-center px-8">
        <Text className="text-gray-400 text-center">No meal plan found in this session.</Text>
        <TouchableOpacity className="mt-4" onPress={() => navigation.goBack()}>
          <Text className="text-primary text-sm">Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const plan = session.currentMealPlan

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-5 pt-4">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-bold">Your Meal Plan</Text>
          <TouchableOpacity onPress={handleDiscard}>
            <Text className="text-red-500 text-sm font-medium">Discard</Text>
          </TouchableOpacity>
        </View>

        <View className="bg-blue-50 rounded-xl p-4 mb-4">
          <View className="flex-row justify-between">
            <Text className="text-sm text-gray-600">{plan.days.length} days</Text>
            <Text className="text-sm text-gray-600">
              ~{plan.nutritionSummary.avgDailyCalories} cal/day
            </Text>
            <Text className="text-sm text-gray-600">
              ~{plan.nutritionSummary.avgProtein}g protein/day
            </Text>
          </View>
        </View>

        {plan.days.map((day: Day) => (
          <View key={day.dayNumber} className="mb-4">
            <Text className="text-base font-semibold mb-2">Day {day.dayNumber}</Text>
            <MealRow
              label="Breakfast"
              meal={day.meals.breakfast}
              onSwap={() => handleSwapMeal(day.dayNumber, 'breakfast', day.meals.breakfast.name)}
            />
            <MealRow
              label="Lunch"
              meal={day.meals.lunch}
              onSwap={() => handleSwapMeal(day.dayNumber, 'lunch', day.meals.lunch.name)}
            />
            <MealRow
              label="Dinner"
              meal={day.meals.dinner}
              onSwap={() => handleSwapMeal(day.dayNumber, 'dinner', day.meals.dinner.name)}
            />
          </View>
        ))}

        <View className="h-24" />
      </ScrollView>

      <View className="px-5 pb-6 pt-3 bg-white border-t border-gray-100">
        <TouchableOpacity
          className="bg-primary py-4 rounded-xl items-center mb-2"
          onPress={handleConfirm}
        >
          <Text className="text-white text-base font-semibold">Confirm Plan</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="py-3 items-center"
          onPress={handleRegenerateAll}
        >
          <Text className="text-primary text-sm font-medium">Regenerate Entire Plan</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}
