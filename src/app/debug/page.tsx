'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { authService } from '@/lib/supabase/auth'

export default function DebugPage() {
  const [authData, setAuthData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check current session
        const { data: { session } } = await supabase.auth.getSession()
        const { data: { user } } = await supabase.auth.getUser()
        
        // Check cookies manually
        const cookies = document.cookie
        
        setAuthData({
          session,
          user,
          cookies,
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        console.error('Debug check error:', error)
        setAuthData({ error: error.message })
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const testLogin = async () => {
    try {
      const result = await authService.login({
        email: 'test@example.com',
        password: 'test123456'
      })
      
      console.log('Test login result:', result)
      
      // Refresh auth data
      const { data: { session } } = await supabase.auth.getSession()
      const { data: { user } } = await supabase.auth.getUser()
      
      setAuthData({
        ...authData,
        loginResult: result,
        session,
        user,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Test login error:', error)
    }
  }

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Auth</h1>
      
      <div className="space-y-4">
        <button 
          onClick={testLogin}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Test Login
        </button>
        
        <div>
          <h2 className="text-lg font-semibold">Auth Data:</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto max-h-96">
            {JSON.stringify(authData, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}