"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function BypassAuthPage() {
  const router = useRouter()
  
  const simulateAuth = () => {
    // Set a simple session in localStorage for testing
    localStorage.setItem('demo-auth', 'true')
    localStorage.setItem('demo-user', JSON.stringify({
      id: 'demo-user-123',
      email: 'demo@example.com',
      full_name: 'Demo User'
    }))
    localStorage.setItem('demo-company', JSON.stringify({
      id: 'demo-company-123', 
      name: 'Demo კომპანია',
      user_id: 'demo-user-123'
    }))
    
    // Redirect to dashboard
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">🔧 Demo Authentication</CardTitle>
          <CardDescription>
            დაჭირეთ ღილაკს რომ შეხვიდეთ dashboard-ზე demo session-ით
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={simulateAuth} className="w-full">
            🚀 შესვლა Dashboard-ზე
          </Button>
          
          <div className="text-sm text-gray-600 text-center">
            <p>ეს არის demo - არ დაამატებს რეალურ user-ს</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}