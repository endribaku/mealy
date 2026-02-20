import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { ActivityIndicator, View, StyleSheet } from 'react-native'
import { useAuth } from '../contexts/AuthContext'
import { AuthStack } from './AuthStack'
import { MainStack } from './MainStack'
import { OnboardingStack } from './OnboardingStack'

function isProfileIncomplete(user: { profile: { diet?: string } } | null): boolean {
  if (!user) return true
  return !user.profile.diet
}

export function RootNavigator() {
  const { session, user, isInitialized } = useAuth()

  if (!isInitialized) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  return (
    <NavigationContainer>
      {!session ? (
        <AuthStack />
      ) : isProfileIncomplete(user) ? (
        <OnboardingStack />
      ) : (
        <MainStack />
      )}
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
