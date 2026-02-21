import React, { useState, useMemo } from 'react'
import { View, Text, ScrollView, SafeAreaView } from 'react-native'
import { Calendar, DateData } from 'react-native-calendars'
import { useQuery } from '@tanstack/react-query'
import { getCalendarMealPlans } from '../api/mealPlans'
import {
  buildMarkedDates,
  getMealsForDate,
  getCurrentMonth,
  getLastDayOfMonth,
  getTodayString,
} from '../lib/calendar-utils'
import type { Day, StoredMealPlan } from '../api/types'

function MealCard({ label, meal }: { label: string; meal: { name: string; cuisine: string; prepTime: number; nutrition: { calories: number } } }) {
  return (
    <View className="bg-gray-50 rounded-xl p-4 mb-3">
      <Text className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</Text>
      <Text className="text-base font-semibold">{meal.name}</Text>
      <View className="flex-row mt-1">
        <Text className="text-xs text-gray-500">{meal.cuisine}</Text>
        <Text className="text-xs text-gray-400 mx-2">·</Text>
        <Text className="text-xs text-gray-500">{meal.prepTime} min</Text>
        <Text className="text-xs text-gray-400 mx-2">·</Text>
        <Text className="text-xs text-gray-500">{meal.nutrition.calories} cal</Text>
      </View>
    </View>
  )
}

export function CalendarScreen() {
  const today = getTodayString()
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth())
  const [selectedDate, setSelectedDate] = useState(today)

  const fromDate = `${currentMonth}-01`
  const toDate = getLastDayOfMonth(currentMonth)

  const { data: plans, isLoading } = useQuery({
    queryKey: ['calendar', currentMonth],
    queryFn: ({ signal }) => getCalendarMealPlans(fromDate, toDate, signal),
  })

  const markedDatesBase = useMemo(() => buildMarkedDates(plans ?? []), [plans])

  // Build react-native-calendars markedDates format
  const markedDates = useMemo(() => {
    const result: Record<string, any> = {}

    for (const [dateStr, { planId }] of Object.entries(markedDatesBase)) {
      result[dateStr] = {
        marked: true,
        dotColor: '#007AFF',
        selected: dateStr === selectedDate,
        selectedColor: '#007AFF',
      }
    }

    // Ensure selected date is always marked
    if (!result[selectedDate]) {
      result[selectedDate] = {
        selected: true,
        selectedColor: '#007AFF',
      }
    } else {
      result[selectedDate] = {
        ...result[selectedDate],
        selected: true,
        selectedColor: '#007AFF',
      }
    }

    return result
  }, [markedDatesBase, selectedDate])

  // Find meals for selected date
  const selectedDayData = useMemo((): { day: Day; plan: StoredMealPlan } | null => {
    if (!plans) return null

    for (const plan of plans) {
      const day = getMealsForDate(plan, selectedDate)
      if (day) return { day, plan }
    }

    return null
  }, [plans, selectedDate])

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString)
  }

  const handleMonthChange = (month: DateData) => {
    const yearMonth = `${month.year}-${String(month.month).padStart(2, '0')}`
    setCurrentMonth(yearMonth)
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Calendar
        current={`${currentMonth}-01`}
        onDayPress={handleDayPress}
        onMonthChange={handleMonthChange}
        markedDates={markedDates}
        theme={{
          selectedDayBackgroundColor: '#007AFF',
          todayTextColor: '#007AFF',
          arrowColor: '#007AFF',
          dotColor: '#007AFF',
          textDayFontSize: 15,
          textMonthFontSize: 16,
          textMonthFontWeight: 'bold',
        }}
      />

      <ScrollView className="flex-1 px-5 pt-4">
        <Text className="text-lg font-bold mb-3">
          {selectedDate === today ? 'Today' : selectedDate}
        </Text>

        {isLoading ? (
          <Text className="text-gray-400 text-center mt-8">Loading...</Text>
        ) : selectedDayData ? (
          <>
            <MealCard label="Breakfast" meal={selectedDayData.day.meals.breakfast} />
            <MealCard label="Lunch" meal={selectedDayData.day.meals.lunch} />
            <MealCard label="Dinner" meal={selectedDayData.day.meals.dinner} />
          </>
        ) : (
          <View className="items-center mt-8">
            <Text className="text-gray-400 text-base">No meals planned</Text>
            <Text className="text-gray-300 text-sm mt-1">
              Generate a meal plan to fill your calendar
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
