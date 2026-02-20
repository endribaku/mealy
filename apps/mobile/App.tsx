import './global.css'
import React from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/query-client'
import { AuthProvider } from './contexts/AuthContext'
import { RootNavigator } from './navigation/RootNavigator'
import { useAppState } from './hooks/useAppState'

function AppContent() {
  useAppState()
  return <RootNavigator />
}

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}
