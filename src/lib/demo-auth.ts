// Demo authentication helpers for testing dashboard without real auth

export function getDemoAuth() {
  if (typeof window === 'undefined') return null
  
  const isAuthenticated = localStorage.getItem('demo-auth') === 'true'
  const user = localStorage.getItem('demo-user')
  const company = localStorage.getItem('demo-company')
  
  if (!isAuthenticated || !user) return null
  
  return {
    user: JSON.parse(user),
    company: company ? JSON.parse(company) : null,
    isAuthenticated: true
  }
}

export function clearDemoAuth() {
  if (typeof window === 'undefined') return
  
  localStorage.removeItem('demo-auth')
  localStorage.removeItem('demo-user')
  localStorage.removeItem('demo-company')
}