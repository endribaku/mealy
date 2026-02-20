import React from 'react'
import { View } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { OnboardingStackParamList } from '../../navigation/types'
import { useOnboarding } from '../../contexts/OnboardingContext'
import { OnboardingLayout } from '../../components/onboarding/OnboardingLayout'
import { SelectionChip } from '../../components/onboarding/SelectionChip'
import { COMMON_ALLERGIES } from '../../types/onboarding'

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Restrictions'>

export function RestrictionsScreen({ navigation }: Props) {
  const { data, setField } = useOnboarding()

  const toggleAllergy = (name: string) => {
    const current = data.allergies
    const exists = current.some((a) => a.name === name)
    const updated = exists
      ? current.filter((a) => a.name !== name)
      : [...current, { name, severity: 'moderate' }]
    setField('allergies', updated)
  }

  const allergyNames = data.allergies.map((a) => a.name)

  return (
    <OnboardingLayout
      title="Any dietary restrictions?"
      subtitle="Select any allergies or food sensitivities"
      step={5}
      totalSteps={7}
      onNext={() => navigation.navigate('Cuisine')}
      onBack={() => navigation.goBack()}
    >
      <View className="flex-row flex-wrap mt-4">
        {COMMON_ALLERGIES.map((allergy) => (
          <SelectionChip
            key={allergy}
            label={allergy}
            selected={allergyNames.includes(allergy)}
            onPress={() => toggleAllergy(allergy)}
          />
        ))}
      </View>
    </OnboardingLayout>
  )
}
