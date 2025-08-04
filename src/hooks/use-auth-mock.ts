"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Mock auth hook for testing dashboard without real authentication
export function useAuth() {
  const [user, setUser] = useState({
    id: 'demo-user-123',
    email: 'demo@example.com',
    created_at: new Date().toISOString(),
  })
  const [loading, setLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(true)
  const router = useRouter()

  const signOut = async () => {
    console.log('Mock sign out')
    router.push('/login')
  }

  return {
    user,
    loading,
    isAuthenticated,
    signOut,
  }
}