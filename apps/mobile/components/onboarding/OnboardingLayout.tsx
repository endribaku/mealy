import React from 'react'
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native'

type Props = {
  title: string
  subtitle?: string
  step: number
  totalSteps: number
  onNext: () => void
  onBack?: () => void
  nextDisabled?: boolean
  nextLabel?: string
  children: React.ReactNode
}

export function OnboardingLayout({
  title, subtitle, step, totalSteps,
  onNext, onBack, nextDisabled, nextLabel = 'Continue', children,
}: Props) {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-6 pt-4">
        <View className="h-1 bg-gray-200 rounded-full">
          <View
            className="h-1 bg-primary rounded-full"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </View>
        <Text className="text-xs text-gray-400 mt-1">{step} of {totalSteps}</Text>
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 24 }}>
        <Text className="text-2xl font-bold mt-6 mb-1">{title}</Text>
        {subtitle && <Text className="text-base text-gray-500 mb-6">{subtitle}</Text>}
        {children}
      </ScrollView>

      <View className="px-6 pb-6 flex-row gap-3">
        {onBack && (
          <TouchableOpacity
            className="flex-1 py-4 items-center rounded-xl bg-gray-100"
            onPress={onBack}
          >
            <Text className="text-base font-semibold text-gray-700">Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          className={`flex-1 py-4 items-center rounded-xl ${nextDisabled ? 'bg-gray-300' : 'bg-primary'}`}
          onPress={onNext}
          disabled={nextDisabled}
        >
          <Text className="text-base font-semibold text-white">{nextLabel}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}
