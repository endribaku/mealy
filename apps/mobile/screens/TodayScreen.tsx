import React, { useMemo } from 'react'
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { getCalendarMealPlans } from '../api/mealPlans'
import { getMealsForDate, getTodayString, findOverlappingPlans } from '../lib/calendar-utils'
import { confirmDialog } from '../lib/confirm-dialog'
import { MealCard } from '../components/MealCard'
import type { MainStackParamList } from '../navigation/types'

type Nav = NativeStackNavigationProp<MainStackParamList>

export function TodayScreen() {
  const { user } = useAuth()
  const navigation = useNavigation<Nav>()
  const today = getTodayString()

  // Fetch plans covering today through 6 days out (7-day overlap window)
  const weekEnd = useMemo(() => {
    const d = new Date(today + 'T00:00:00')
    d.setDate(d.getDate() + 6)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }, [today])

  const { data: plans, isLoading } = useQuery({
    queryKey: ['calendar', 'today', today],
    queryFn: ({ signal }) => getCalendarMealPlans(today, weekEnd, signal),
  })

  const todayData = useMemo(() => {
    if (!plans) return null
    for (const plan of plans) {
      const day = getMealsForDate(plan, today)
      if (day) return { day, plan }
    }
    return null
  }, [plans, today])

  const handleGenerate = async () => {
    const conflicts = findOverlappingPlans(plans ?? [], today)

    if (conflicts.length > 0) {
      const planDates = conflicts
        .map(p => `${p.startDate} to ${p.endDate}`)
        .join('\n')

      const confirmed = await confirmDialog({
        title: 'Replace Existing Plan?',
        message: `This will replace your existing meal plan:\n${planDates}`,
        confirmText: 'Replace',
        destructive: true,
      })

      if (!confirmed) return
    }

    navigation.navigate('Generating', { startDate: today })
  }

  const weekday = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-5 pt-6">
        <Text className="text-2xl font-bold">Hello, {user?.profile.name ?? 'User'}!</Text>
        <Text className="text-sm text-gray-400 mt-1 mb-6">{weekday}</Text>

        {isLoading ? (
          <Text className="text-gray-400 text-center mt-12">Loading...</Text>
        ) : todayData ? (
          <>
            <Text className="text-lg font-semibold mb-3">Today's Meals</Text>
            <MealCard label="Breakfast" meal={todayData.day.meals.breakfast} />
            <MealCard label="Lunch" meal={todayData.day.meals.lunch} />
            <MealCard label="Dinner" meal={todayData.day.meals.dinner} />
          </>
        ) : (
          <View className="items-center mt-12">
            <Text className="text-gray-400 text-base mb-2">No meals planned for today</Text>
            <Text className="text-gray-300 text-sm mb-6">
              Generate a meal plan to get started
            </Text>
            <TouchableOpacity
              className="bg-primary py-4 px-8 rounded-xl"
              onPress={handleGenerate}
            >
              <Text className="text-white text-base font-semibold">Generate Meal Plan</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
