import React from 'react'
import { View } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { OnboardingStackParamList } from '../../navigation/types'
import { useOnboarding } from '../../contexts/OnboardingContext'
import { OnboardingLayout } from '../../components/onboarding/OnboardingLayout'
import { SelectionChip } from '../../components/onboarding/SelectionChip'
import { GOAL_OPTIONS } from '../../types/onboarding'

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Goals'>

export function GoalsScreen({ navigation }: Props) {
  const { data, setField } = useOnboarding()

  const toggleGoal = (value: string) => {
    const current = data.goals
    const updated = current.includes(value)
      ? current.filter((g) => g !== value)
      : [...current, value]
    setField('goals', updated)
  }

  return (
    <OnboardingLayout
      title="What are your goals?"
      subtitle="Select all that apply"
      step={2}
      totalSteps={7}
      onNext={() => navigation.navigate('Body')}
      onBack={() => navigation.goBack()}
    >
      <View className="flex-row flex-wrap mt-4">
        {GOAL_OPTIONS.map((option) => (
          <SelectionChip
            key={option.value}
            label={option.label}
            selected={data.goals.includes(option.value)}
            onPress={() => toggleGoal(option.value)}
          />
        ))}
      </View>
    </OnboardingLayout>
  )
}
