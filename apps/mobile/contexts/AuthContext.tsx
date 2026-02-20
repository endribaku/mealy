import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { getCurrentUser } from '../api/users'
import type { User } from '../api/types'

type AuthState = {
  session: Session | null
  user: User | null
  isLoading: boolean
  isInitialized: boolean
}

type AuthContextValue = AuthState & {
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  const mountedRef = useRef(true)

  const fetchAppUser = useCallback(async (): Promise<User | null> => {
    try {
      return await getCurrentUser()
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true

    supabase.auth.getSession().then(({ data: { session: initial } }) => {
      if (!mountedRef.current) return

      setSession(initial)

      if (initial) {
        fetchAppUser().then((appUser) => {
          if (!mountedRef.current) return
          setUser(appUser)
          setIsInitialized(true)
        })
      } else {
        setIsInitialized(true)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mountedRef.current) return

        setSession(newSession)

        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && newSession) {
          const appUser = await fetchAppUser()
          if (mountedRef.current) setUser(appUser)
        }

        if (event === 'SIGNED_OUT') {
          setUser(null)
        }
      }
    )

    return () => {
      mountedRef.current = false
      subscription.unsubscribe()
    }
  }, [fetchAppUser])

  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
    } finally {
      if (mountedRef.current) setIsLoading(false)
    }
  }, [])

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    setIsLoading(true)
    try {
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      })
      if (error) throw error

      if (!data.session) {
        throw new Error('Please check your email to confirm your account')
      }
    } finally {
      if (mountedRef.current) setIsLoading(false)
    }
  }, [])

  const refreshUser = useCallback(async () => {
    const appUser = await fetchAppUser()
    if (mountedRef.current) setUser(appUser)
  }, [fetchAppUser])

  const signOut = useCallback(async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } finally {
      if (mountedRef.current) setIsLoading(false)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ session, user, isLoading, isInitialized, signIn, signUp, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
