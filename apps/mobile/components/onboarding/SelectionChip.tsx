import React from 'react'
import { TouchableOpacity, Text } from 'react-native'

type Props = {
  label: string
  selected: boolean
  onPress: () => void
}

export function SelectionChip({ label, selected, onPress }: Props) {
  return (
    <TouchableOpacity
      className={`px-4 py-3 rounded-xl border mr-2 mb-2 ${
        selected ? 'bg-primary border-primary' : 'bg-white border-gray-200'
      }`}
      onPress={onPress}
    >
      <Text className={`text-sm font-medium ${selected ? 'text-white' : 'text-gray-700'}`}>
        {label}
      </Text>
    </TouchableOpacity>
  )
}
