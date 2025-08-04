"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '../../lib/supabase/auth'
import type { User, Session } from '@supabase/supabase-js'
import { toast } from 'sonner'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get current user and session
        const [currentUser, currentSession] = await Promise.all([
          authService.getCurrentUser(),
          authService.getCurrentSession()
        ])

        setUser(currentUser)
        setIsAuthenticated(!!currentUser && !!currentSession)
      } catch (error) {
        console.error('Error initializing auth:', error)
        setUser(null)
        setIsAuthenticated(false)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Subscribe to auth state changes
    const { data: { subscription } } = authService.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, !!session)
        
        setUser(session?.user ?? null)
        setIsAuthenticated(!!session?.user)
        
        // Handle different auth events
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('User signed in:', session.user.email)
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out')
          setUser(null)
          setIsAuthenticated(false)
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed')
        }
        
        router.refresh()
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  const signOut = async () => {
    try {
      const result = await authService.logout()
      
      if (result.success) {
        toast.success('წარმატებით გახვედით სისტემიდან')
        router.push('/login')
        router.refresh()
      } else {
        toast.error(result.message || 'გასვლა ვერ მოხერხდა')
      }
    } catch (error) {
      console.error('Sign out error:', error)
      toast.error('გასვლა ვერ მოხერხდა')
    }
  }

  // Additional utility methods
  const refreshSession = async () => {
    try {
      const session = await authService.getCurrentSession()
      setUser(session?.user ?? null)
      setIsAuthenticated(!!session?.user)
      return session
    } catch (error) {
      console.error('Error refreshing session:', error)
      return null
    }
  }

  const isEmailConfirmed = () => {
    return user?.email_confirmed_at !== null
  }

  return {
    user,
    loading,
    isAuthenticated,
    signOut,
    refreshSession,
    isEmailConfirmed,
  }
}