import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useAuth } from '../contexts/AuthContext'
import type { MainStackParamList } from '../navigation/types'

type HomeNav = NativeStackNavigationProp<MainStackParamList, 'Home'>

export function HomeScreen() {
  const { user, signOut, isLoading } = useAuth()
  const navigation = useNavigation<HomeNav>()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error: any) {
      Alert.alert('Error', error.message ?? 'Failed to sign out')
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Hello, {user?.profile.name ?? 'User'}!</Text>
      <Text style={styles.email}>{user?.email}</Text>

      <TouchableOpacity
        style={styles.calendarButton}
        onPress={() => navigation.navigate('Calendar')}
      >
        <Text style={styles.calendarButtonText}>Meal Calendar</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleSignOut}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 32,
  },
  calendarButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginBottom: 12,
  },
  calendarButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
