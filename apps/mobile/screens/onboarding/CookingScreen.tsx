import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { OnboardingStackParamList } from '../../navigation/types'
import { useOnboarding } from '../../contexts/OnboardingContext'
import { OnboardingLayout } from '../../components/onboarding/OnboardingLayout'
import { SelectionChip } from '../../components/onboarding/SelectionChip'
import { COOKING_SKILL_OPTIONS, SPICE_LEVEL_OPTIONS, COMPLEXITY_OPTIONS } from '../../types/onboarding'

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Cooking'>

export function CookingScreen({ navigation }: Props) {
  const { data, setField } = useOnboarding()

  return (
    <OnboardingLayout
      title="Your cooking preferences"
      step={4}
      totalSteps={7}
      onNext={() => navigation.navigate('Restrictions')}
      onBack={() => navigation.goBack()}
      nextDisabled={!data.cookingSkill}
    >
      <View className="mt-4">
        <Text className="text-sm font-semibold text-gray-700 mb-2">Cooking skill</Text>
        <View className="mb-6">
          {COOKING_SKILL_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              className={`p-4 rounded-xl border mb-2 ${
                data.cookingSkill === option.value
                  ? 'bg-primary border-primary'
                  : 'bg-white border-gray-200'
              }`}
              onPress={() => setField('cookingSkill', option.value)}
            >
              <Text className={`text-base font-medium ${
                data.cookingSkill === option.value ? 'text-white' : 'text-gray-800'
              }`}>
                {option.label}
              </Text>
              <Text className={`text-sm mt-0.5 ${
                data.cookingSkill === option.value ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {option.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text className="text-sm font-semibold text-gray-700 mb-2">Spice preference</Text>
        <View className="flex-row flex-wrap mb-6">
          {SPICE_LEVEL_OPTIONS.map((option) => (
            <SelectionChip
              key={option.value}
              label={option.label}
              selected={data.spiceLevel === option.value}
              onPress={() => setField('spiceLevel', option.value)}
            />
          ))}
        </View>

        <Text className="text-sm font-semibold text-gray-700 mb-2">Recipe complexity</Text>
        <View className="flex-row flex-wrap">
          {COMPLEXITY_OPTIONS.map((option) => (
            <SelectionChip
              key={option.value}
              label={option.label}
              selected={data.preferredComplexity === option.value}
              onPress={() => setField('preferredComplexity', option.value)}
            />
          ))}
        </View>
      </View>
    </OnboardingLayout>
  )
}
