import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native'
import { Calendar, DateData } from 'react-native-calendars'
import { useQuery } from '@tanstack/react-query'
import { getMealPlans } from '../api/mealPlans'
import { buildMarkedDates, getTodayString } from '../lib/calendar-utils'

type Props = {
  numberOfDays: number
  onConfirm: (startDate: string) => void
  isPending: boolean
}

export function StartDatePicker({ numberOfDays, onConfirm, isPending }: Props) {
  const today = getTodayString()
  const [selectedDate, setSelectedDate] = useState<string>(today)

  const { data: existingPlans } = useQuery({
    queryKey: ['meal-plans'],
    queryFn: ({ signal }) => getMealPlans(signal),
  })

  const existingMarked = buildMarkedDates(existingPlans ?? [])

  // Build disabled dates from existing plans
  const disabledDates: Record<string, boolean> = {}
  for (const dateStr of Object.keys(existingMarked)) {
    disabledDates[dateStr] = true
  }

  // Check if selection would overlap
  const wouldOverlap = (startDate: string): boolean => {
    const start = new Date(startDate + 'T00:00:00')
    for (let i = 0; i < numberOfDays; i++) {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      const key = d.toISOString().split('T')[0]
      if (disabledDates[key]) return true
    }
    return false
  }

  // Build marked dates for display
  const markedDates: Record<string, any> = {}

  // Mark existing plan dates as disabled
  for (const dateStr of Object.keys(existingMarked)) {
    markedDates[dateStr] = {
      disabled: true,
      disableTouchEvent: true,
      dotColor: '#ccc',
      marked: true,
    }
  }

  // Mark selected range
  if (selectedDate) {
    const start = new Date(selectedDate + 'T00:00:00')
    for (let i = 0; i < numberOfDays; i++) {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      const key = d.toISOString().split('T')[0]
      if (!disabledDates[key]) {
        markedDates[key] = {
          color: '#007AFF',
          textColor: 'white',
          ...(i === 0 && { startingDay: true }),
          ...(i === numberOfDays - 1 && { endingDay: true }),
        }
      }
    }
  }

  const hasOverlap = wouldOverlap(selectedDate)

  const handleDayPress = (day: DateData) => {
    if (day.dateString < today) return
    setSelectedDate(day.dateString)
  }

  return (
    <View className="flex-1 bg-white px-6 pt-4">
      <Text className="text-xl font-bold text-center mb-2">
        Choose Start Date
      </Text>
      <Text className="text-sm text-gray-500 text-center mb-4">
        Your {numberOfDays}-day meal plan will start on the selected date
      </Text>

      <Calendar
        current={today}
        minDate={today}
        onDayPress={handleDayPress}
        markingType="period"
        markedDates={markedDates}
        theme={{
          selectedDayBackgroundColor: '#007AFF',
          todayTextColor: '#007AFF',
          arrowColor: '#007AFF',
          textDayFontSize: 15,
          textMonthFontSize: 16,
          textMonthFontWeight: 'bold',
        }}
      />

      {hasOverlap && (
        <Text className="text-danger text-sm text-center mt-3">
          This range overlaps with an existing meal plan. Pick different dates.
        </Text>
      )}

      <View className="mt-4">
        <TouchableOpacity
          className="bg-primary py-4 rounded-xl items-center"
          onPress={() => onConfirm(selectedDate)}
          disabled={isPending || hasOverlap}
          style={{ opacity: isPending || hasOverlap ? 0.5 : 1 }}
        >
          {isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-base font-semibold">
              Confirm & Start on {selectedDate}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          className="py-3 items-center mt-2"
          onPress={() => setSelectedDate(today)}
          disabled={isPending}
        >
          <Text className="text-primary text-sm">Start Today</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
