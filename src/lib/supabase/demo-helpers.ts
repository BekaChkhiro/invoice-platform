import { redirect } from "next/navigation"

// Demo versions of authentication helpers
export async function requireAuthDemo() {
  // For demo purposes, return a fake user
  // In real app, this would check actual authentication
  return {
    id: 'demo-user-123',
    email: 'demo@example.com',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}

export async function getCompanyDemo(userId: string) {
  // For demo purposes, return a fake company
  return { 
    data: {
      id: 'demo-company-123',
      name: 'Demo კომპანია',
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, 
    error: null 
  }
}