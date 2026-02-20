import React from 'react'
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { OnboardingStackParamList } from '../../navigation/types'

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Welcome'>

export function WelcomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center px-8">
        <Text className="text-3xl font-bold text-center mb-4">
          Let's personalize your experience
        </Text>
        <Text className="text-base text-gray-500 text-center mb-12 leading-6">
          We'll ask a few questions to customize your meal plans to your preferences, dietary needs, and cooking style.
        </Text>

        <TouchableOpacity
          className="bg-primary py-4 rounded-xl items-center"
          onPress={() => navigation.navigate('Diet')}
        >
          <Text className="text-white text-base font-semibold">Get Started</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}
