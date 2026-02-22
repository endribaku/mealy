import React, { useState, useMemo } from 'react'
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native'
import { Calendar, DateData } from 'react-native-calendars'
import { useQuery } from '@tanstack/react-query'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import { getCalendarMealPlans } from '../api/mealPlans'
import {
  buildMarkedDates,
  getMealsForDate,
  getCurrentMonth,
  getLastDayOfMonth,
  getTodayString,
  findOverlappingPlans,
} from '../lib/calendar-utils'
import { confirmDialog } from '../lib/confirm-dialog'
import { MealCard } from '../components/MealCard'
import type { MainStackParamList } from '../navigation/types'
import type { Day, StoredMealPlan } from '../api/types'

type Nav = NativeStackNavigationProp<MainStackParamList>

export function CalendarScreen() {
  const navigation = useNavigation<Nav>()
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

    for (const [dateStr] of Object.entries(markedDatesBase)) {
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

  const handleGenerate = async (date: string) => {
    const effectiveStart = date < today ? today : date
    const conflicts = findOverlappingPlans(plans ?? [], effectiveStart)

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

    navigation.navigate('Generating', { startDate: effectiveStart })
  }

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
        minDate={today}
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
          <View className="items-center mt-8 px-4">
            <Text className="text-gray-400 text-base font-medium">No meals planned</Text>
            <Text className="text-gray-300 text-sm mt-1 mb-5 text-center">
              This day doesn't have a meal plan yet
            </Text>
            <TouchableOpacity
              className="bg-blue-50 border border-blue-200 px-5 py-3 rounded-xl"
              onPress={() => handleGenerate(selectedDate)}
            >
              <Text className="text-blue-600 font-semibold text-sm">
                Generate starting {selectedDate}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        className="absolute bottom-20 right-5 w-14 h-14 bg-blue-600 rounded-full items-center justify-center shadow-lg"
        style={{ elevation: 5 }}
        onPress={() => handleGenerate(selectedDate)}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  )
}
