import React from 'react'
import { View } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { OnboardingStackParamList } from '../../navigation/types'
import { useOnboarding } from '../../contexts/OnboardingContext'
import { OnboardingLayout } from '../../components/onboarding/OnboardingLayout'
import { SelectionChip } from '../../components/onboarding/SelectionChip'
import { COMMON_CUISINES } from '../../types/onboarding'

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Cuisine'>

export function CuisineScreen({ navigation }: Props) {
  const { data, setField } = useOnboarding()

  const toggleCuisine = (value: string) => {
    const current = data.favoriteCuisines
    const updated = current.includes(value)
      ? current.filter((c) => c !== value)
      : [...current, value]
    setField('favoriteCuisines', updated)
  }

  return (
    <OnboardingLayout
      title="Favorite cuisines"
      subtitle="Pick cuisines you enjoy"
      step={6}
      totalSteps={7}
      onNext={() => navigation.navigate('OnboardingComplete')}
      onBack={() => navigation.goBack()}
    >
      <View className="flex-row flex-wrap mt-4">
        {COMMON_CUISINES.map((cuisine) => (
          <SelectionChip
            key={cuisine}
            label={cuisine}
            selected={data.favoriteCuisines.includes(cuisine)}
            onPress={() => toggleCuisine(cuisine)}
          />
        ))}
      </View>
    </OnboardingLayout>
  )
}
