import React from 'react'
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Alert } from 'react-native'
import { useAuth } from '../contexts/AuthContext'

export function ProfileScreen() {
  const { user, signOut, isLoading } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error: any) {
      Alert.alert('Error', error.message ?? 'Failed to sign out')
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-5 pt-6">
        <Text className="text-2xl font-bold">{user?.profile.name ?? 'User'}</Text>
        <Text className="text-sm text-gray-400 mt-1 mb-8">{user?.email}</Text>

        <View className="bg-gray-50 rounded-xl p-4 mb-4">
          <Text className="text-xs text-gray-400 uppercase tracking-wide mb-2">Diet & Goals</Text>
          <Text className="text-sm text-gray-700 mb-1">Diet: {user?.profile.diet ?? 'Not set'}</Text>
          <Text className="text-sm text-gray-700 mb-1">Calorie Target: {user?.profile.calorieTarget ?? 'Not set'}</Text>
          <Text className="text-sm text-gray-700 mb-1">Cooking Skill: {user?.profile.cookingSkill ?? 'Not set'}</Text>
          <Text className="text-sm text-gray-700 mb-1">Household: {user?.profile.householdSize ?? 1} people</Text>
          <Text className="text-sm text-gray-700">Goals: {user?.profile.goals?.join(', ') || 'None set'}</Text>
        </View>

        <TouchableOpacity
          className="bg-red-500 py-4 rounded-xl items-center mt-4"
          onPress={handleSignOut}
          disabled={isLoading}
          style={{ opacity: isLoading ? 0.6 : 1 }}
        >
          <Text className="text-white text-base font-semibold">Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}
