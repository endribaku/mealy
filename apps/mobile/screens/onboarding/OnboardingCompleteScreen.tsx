import React from 'react'
import { View, Text, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator } from 'react-native'
import { useOnboarding } from '../../contexts/OnboardingContext'
import { useAuth } from '../../contexts/AuthContext'
import { useSubmitOnboarding } from '../../hooks/useSubmitOnboarding'

export function OnboardingCompleteScreen() {
  const { data } = useOnboarding()
  const { session, refreshUser } = useAuth()
  const submitOnboarding = useSubmitOnboarding()
  const email = session?.user.email ?? ''
  const name = session?.user.user_metadata?.full_name || email.split('@')[0]

  const handleFinish = async () => {
    try {
      await submitOnboarding.mutateAsync({ data, email, name })
      await refreshUser()
    } catch (error: any) {
      Alert.alert(
        'Something went wrong',
        error.message ?? 'Failed to save your preferences. Please try again.',
        [{ text: 'Retry', onPress: handleFinish }, { text: 'Cancel' }]
      )
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center px-8">
        <Text className="text-3xl font-bold text-center mb-4">
          You're all set!
        </Text>
        <Text className="text-base text-gray-500 text-center mb-12 leading-6">
          We'll create personalized meal plans just for you based on your preferences.
        </Text>

        <TouchableOpacity
          className={`py-4 rounded-xl items-center ${
            submitOnboarding.isPending ? 'bg-gray-300' : 'bg-primary'
          }`}
          onPress={handleFinish}
          disabled={submitOnboarding.isPending}
        >
          {submitOnboarding.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-base font-semibold">
              Generate My First Meal Plan
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}
