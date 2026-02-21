import React, { useState } from 'react'
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, SafeAreaView } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RouteProp } from '@react-navigation/native'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { regenerateFullPlan } from '../api/mealPlans'
import { SelectionChip } from '../components/onboarding/SelectionChip'
import type { MainStackParamList } from '../navigation/types'

type Nav = NativeStackNavigationProp<MainStackParamList, 'RegenerateFull'>
type Route = RouteProp<MainStackParamList, 'RegenerateFull'>

const REASONS = [
  "Doesn't match my preferences",
  'Too many complex recipes',
  'Want more variety',
  'Other',
]

export function RegenerateFullScreen() {
  const navigation = useNavigation<Nav>()
  const route = useRoute<Route>()
  const queryClient = useQueryClient()
  const { sessionId } = route.params

  const [selectedReason, setSelectedReason] = useState<string | null>(null)
  const [customReason, setCustomReason] = useState('')

  const reason = selectedReason === 'Other' ? customReason : selectedReason

  const mutation = useMutation({
    mutationFn: () => regenerateFullPlan(sessionId, reason!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
      navigation.goBack()
    },
  })

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-5 pt-6">
        <Text className="text-xl font-bold mb-1">Regenerate Entire Plan</Text>
        <Text className="text-sm text-red-400 mb-6">This will replace all meals in your current draft</Text>

        <Text className="text-sm font-medium text-gray-600 mb-3">
          Why do you want a new plan?
        </Text>

        <View className="flex-row flex-wrap mb-4">
          {REASONS.map((r) => (
            <SelectionChip
              key={r}
              label={r}
              selected={selectedReason === r}
              onPress={() => setSelectedReason(r)}
            />
          ))}
        </View>

        {selectedReason === 'Other' && (
          <TextInput
            className="border border-gray-200 rounded-xl px-4 py-3 text-sm mb-4"
            placeholder="Tell us why..."
            value={customReason}
            onChangeText={setCustomReason}
            multiline
          />
        )}

        {mutation.isError && (
          <Text className="text-red-500 text-sm mb-4">
            {mutation.error?.message ?? 'Failed to regenerate plan'}
          </Text>
        )}

        <TouchableOpacity
          className="bg-primary py-4 rounded-xl items-center"
          onPress={() => mutation.mutate()}
          disabled={!reason || mutation.isPending}
          style={{ opacity: !reason || mutation.isPending ? 0.5 : 1 }}
        >
          {mutation.isPending ? (
            <View>
              <ActivityIndicator color="#fff" />
              <Text className="text-white text-xs mt-2">This can take up to 30 seconds...</Text>
            </View>
          ) : (
            <Text className="text-white text-base font-semibold">Regenerate Plan</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          className="py-3 items-center mt-2"
          onPress={() => navigation.goBack()}
          disabled={mutation.isPending}
        >
          <Text className="text-gray-400 text-sm">Cancel</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}
