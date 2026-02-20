import React from 'react'
import { View } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { OnboardingStackParamList } from '../../navigation/types'
import { useOnboarding } from '../../contexts/OnboardingContext'
import { OnboardingLayout } from '../../components/onboarding/OnboardingLayout'
import { SelectionChip } from '../../components/onboarding/SelectionChip'
import { DIET_OPTIONS } from '../../types/onboarding'

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Diet'>

export function DietScreen({ navigation }: Props) {
  const { data, setField } = useOnboarding()

  return (
    <OnboardingLayout
      title="What's your diet?"
      subtitle="Choose the one that best describes how you eat"
      step={1}
      totalSteps={7}
      onNext={() => navigation.navigate('Goals')}
      onBack={() => navigation.goBack()}
      nextDisabled={!data.diet}
    >
      <View className="flex-row flex-wrap mt-4">
        {DIET_OPTIONS.map((option) => (
          <SelectionChip
            key={option.value}
            label={option.label}
            selected={data.diet === option.value}
            onPress={() => setField('diet', option.value)}
          />
        ))}
      </View>
    </OnboardingLayout>
  )
}
