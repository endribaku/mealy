import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'

type MealCardProps = {
  label: string
  meal: {
    name: string
    cuisine: string
    prepTime: number
    nutrition: { calories: number }
  }
  onPress?: () => void
}

export function MealCard({ label, meal, onPress }: MealCardProps) {
  const content = (
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

  if (onPress) {
    return <TouchableOpacity onPress={onPress}>{content}</TouchableOpacity>
  }

  return content
}
