import React from 'react'
import { View, Text, TextInput } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { OnboardingStackParamList } from '../../navigation/types'
import { useOnboarding } from '../../contexts/OnboardingContext'
import { OnboardingLayout } from '../../components/onboarding/OnboardingLayout'
import { SelectionChip } from '../../components/onboarding/SelectionChip'

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Body'>

const HOUSEHOLD_SIZES = [1, 2, 3, 4, 5, 6] as const

export function BodyScreen({ navigation }: Props) {
  const { data, setField } = useOnboarding()

  return (
    <OnboardingLayout
      title="A few basics"
      step={3}
      totalSteps={7}
      onNext={() => navigation.navigate('Cooking')}
      onBack={() => navigation.goBack()}
      nextDisabled={!data.calorieTarget}
    >
      <View className="mt-4">
        <Text className="text-sm font-semibold text-gray-700 mb-2">Daily calorie target</Text>
        <TextInput
          className="border border-gray-200 rounded-xl px-4 py-3 text-base mb-1"
          placeholder="e.g. 2000"
          keyboardType="numeric"
          value={data.calorieTarget?.toString() ?? ''}
          onChangeText={(text) => {
            const num = parseInt(text, 10)
            setField('calorieTarget', isNaN(num) ? null : num)
          }}
        />
        <Text className="text-xs text-gray-400 mb-6">Recommended: 1500-2500 calories</Text>

        <Text className="text-sm font-semibold text-gray-700 mb-2">Household size</Text>
        <View className="flex-row flex-wrap mb-6">
          {HOUSEHOLD_SIZES.map((size) => (
            <SelectionChip
              key={size}
              label={size.toString()}
              selected={data.householdSize === size}
              onPress={() => setField('householdSize', size)}
            />
          ))}
        </View>

        <Text className="text-sm font-semibold text-gray-700 mb-2">Measurement system</Text>
        <View className="flex-row">
          <SelectionChip
            label="Imperial"
            selected={data.measurementSystem === 'imperial'}
            onPress={() => setField('measurementSystem', 'imperial')}
          />
          <SelectionChip
            label="Metric"
            selected={data.measurementSystem === 'metric'}
            onPress={() => setField('measurementSystem', 'metric')}
          />
        </View>
      </View>
    </OnboardingLayout>
  )
}
