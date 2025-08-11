import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { subscriptionService } from '@/lib/services/subscription'

// Rate limits by plan
const RATE_LIMITS = {
  FREE: { requests: 10, window: 60 * 1000 }, // 10 req/min
  BASIC: { requests: 50, window: 60 * 1000 }, // 50 req/min  
  PRO: { requests: 200, window: 60 * 1000 }, // 200 req/min
} as const

// Feature requirements by route
const FEATURE_REQUIREMENTS = {
  '/api/invoices/send': 'can_send_email',
  '/api/analytics': 'advanced_analytics',
  '/api/export': 'can_export_pdf',
  '/api/team': 'can_use_team_members',
  '/api/branding': 'can_use_custom_branding',
} as const

// Simple in-memory rate limiting (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

/**
 * Check if user hasn't exceeded invoice limit
 */
export async function checkInvoiceLimit(userId: string): Promise<{
  allowed: boolean
  message: string
  currentUsage?: { used: number; limit: number }
}> {
  try {
    const limitCheck = await subscriptionService.checkInvoiceLimit(userId)
    
    if (!limitCheck.allowed) {
      return {
        allowed: false,
        message: 'თქვენი ინვოისების ლიმიტი ამოწურულია',
        currentUsage: {
          used: limitCheck.used || 0,
          limit: limitCheck.limit || 0
        }
      }
    }
    
    return {
      allowed: true,
      message: 'Invoice creation allowed'
    }
  } catch (error) {
    console.error('Error checking invoice limit:', error)
    // Fail open for non-critical errors
    return {
      allowed: true,
      message: 'Unable to verify limit, allowing request'
    }
  }
}

/**
 * Check if user has access to specific feature
 */
export async function checkFeatureAccess(
  userId: string, 
  feature: keyof typeof FEATURE_REQUIREMENTS[keyof typeof FEATURE_REQUIREMENTS]
): Promise<{
  hasAccess: boolean
  requiredPlan?: string
  message: string
}> {
  try {
    const hasAccess = await subscriptionService.checkFeatureAccess(userId, feature)
    
    if (!hasAccess) {
      const requiredPlans = {
        'can_send_email': 'BASIC',
        'advanced_analytics': 'BASIC', 
        'can_export_pdf': 'PRO',
        'can_use_team_members': 'PRO',
        'can_use_custom_branding': 'BASIC',
      }
      
      return {
        hasAccess: false,
        requiredPlan: requiredPlans[feature] || 'BASIC',
        message: 'ეს ფუნქცია თქვენი გეგმით მიუწვდომელია'
      }
    }
    
    return {
      hasAccess: true,
      message: 'Feature access granted'
    }
  } catch (error) {
    console.error('Error checking feature access:', error)
    return {
      hasAccess: false,
      message: 'Unable to verify feature access'
    }
  }
}

/**
 * Rate limiting by plan level
 */
export async function rateLimitByPlan(
  userId: string, 
  planName: keyof typeof RATE_LIMITS = 'FREE'
): Promise<{
  allowed: boolean
  resetTime?: number
  message: string
}> {
  const limit = RATE_LIMITS[planName]
  const key = `${userId}-${planName}`
  const now = Date.now()
  
  const current = rateLimitStore.get(key)
  
  // Reset if window expired
  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + limit.window
    })
    
    return {
      allowed: true,
      message: 'Request allowed'
    }
  }
  
  // Check if limit exceeded
  if (current.count >= limit.requests) {
    return {
      allowed: false,
      resetTime: current.resetTime,
      message: 'მოთხოვნების ლიმიტი გადაჭარბებულია'
    }
  }
  
  // Increment counter
  rateLimitStore.set(key, {
    count: current.count + 1,
    resetTime: current.resetTime
  })
  
  return {
    allowed: true,
    message: 'Request allowed'
  }
}

/**
 * Middleware function to check plan and limits
 */
export async function planEnforcementMiddleware(
  request: Request,
  context: { userId: string; path: string; method: string }
) {
  const { userId, path, method } = context
  
  try {
    // Get user's current plan
    const subscription = await subscriptionService.getCurrentUserPlan(userId)
    const planName = subscription?.plan?.name || 'FREE'
    const planLevel = planName.toUpperCase() as keyof typeof RATE_LIMITS
    
    // Rate limiting
    const rateLimitResult = await rateLimitByPlan(userId, planLevel)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: rateLimitResult.message,
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((rateLimitResult.resetTime! - Date.now()) / 1000)
        },
        { status: 429 }
      )
    }
    
    // Check invoice limit for invoice creation
    if (path === '/api/invoices' && method === 'POST') {
      const limitCheck = await checkInvoiceLimit(userId)
      
      if (!limitCheck.allowed) {
        return NextResponse.json(
          {
            error: 'Invoice limit exceeded',
            message: limitCheck.message,
            code: 'INVOICE_LIMIT_EXCEEDED',
            currentUsage: limitCheck.currentUsage,
            upgradeUrl: '/dashboard/settings/billing',
            requiredPlan: planName === 'FREE' ? 'BASIC' : 'PRO'
          },
          { status: 402 }
        )
      }
    }
    
    // Check feature access
    const requiredFeature = FEATURE_REQUIREMENTS[path as keyof typeof FEATURE_REQUIREMENTS]
    if (requiredFeature) {
      const featureCheck = await checkFeatureAccess(userId, requiredFeature as any)
      
      if (!featureCheck.hasAccess) {
        return NextResponse.json(
          {
            error: 'Feature not available',
            message: featureCheck.message,
            code: 'FEATURE_NOT_AVAILABLE',
            requiredPlan: featureCheck.requiredPlan,
            upgradeUrl: '/dashboard/settings/billing'
          },
          { status: 403 }
        )
      }
    }
    
    // All checks passed
    return null
    
  } catch (error) {
    console.error('Plan enforcement middleware error:', error)
    
    // Fail open for system errors to prevent blocking legitimate requests
    return null
  }
}

/**
 * Helper to create error responses
 */
export function createPlanErrorResponse(
  type: 'LIMIT_EXCEEDED' | 'FEATURE_BLOCKED' | 'RATE_LIMITED',
  details: {
    message: string
    currentUsage?: any
    requiredPlan?: string
    retryAfter?: number
  }
) {
  const statusCodes = {
    LIMIT_EXCEEDED: 402,
    FEATURE_BLOCKED: 403,
    RATE_LIMITED: 429,
  }
  
  return NextResponse.json(
    {
      error: type.toLowerCase().replace('_', ' '),
      message: details.message,
      code: type,
      ...details,
      upgradeUrl: '/dashboard/settings/billing'
    },
    { status: statusCodes[type] }
  )
}

/**
 * Client-side helper to handle plan errors
 */
export function handlePlanError(error: any) {
  if (!error?.response?.data) return
  
  const { code, message, requiredPlan, currentUsage } = error.response.data
  
  switch (code) {
    case 'INVOICE_LIMIT_EXCEEDED':
      return {
        type: 'limit',
        title: 'ინვოისების ლიმიტი ამოწურულია',
        message,
        action: 'გეგმის განახლება',
        actionUrl: '/dashboard/settings/billing',
        data: currentUsage
      }
      
    case 'FEATURE_NOT_AVAILABLE':
      return {
        type: 'feature',
        title: 'ფუნქცია მიუწვდომელია',
        message,
        action: `${requiredPlan} გეგმაზე განახლება`,
        actionUrl: '/dashboard/settings/billing',
        data: { requiredPlan }
      }
      
    case 'RATE_LIMIT_EXCEEDED':
      return {
        type: 'rate',
        title: 'ძალიან ბევრი მოთხოვნა',
        message,
        action: 'ცოტა ხნის შემდეგ სცადეთ',
        data: { retryAfter: error.response.data.retryAfter }
      }
      
    default:
      return null
  }
}

/**
 * Usage logging for plan enforcement
 */
export async function logPlanEnforcement(
  userId: string,
  action: 'allowed' | 'blocked',
  resource: string,
  reason?: string
) {
  try {
    await subscriptionService.logUsage(
      userId,
      action === 'allowed' ? 'create' : 'view',
      resource as any,
      null,
      {
        enforcement: action,
        reason,
        timestamp: new Date().toISOString()
      }
    )
  } catch (error) {
    console.error('Error logging plan enforcement:', error)
  }
}