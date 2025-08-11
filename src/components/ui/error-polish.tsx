'use client'

import React, { Component, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { georgianMessages } from './loading-enhancements'
import { errorToast, warningToast } from './notifications'
import { animations } from './animations'
import { useRouter } from 'next/navigation'
import { AlertCircle, Home, RefreshCw, Wifi, WifiOff } from 'lucide-react'

// Error boundary component
interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  resetKeys?: any[]
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (this.state.hasError) {
      const { resetKeys: prevResetKeys = [] } = prevProps
      const { resetKeys = [] } = this.props
      
      // Check if any reset keys have changed
      if (resetKeys.length > 0 && 
          prevResetKeys.some((key, i) => key !== resetKeys[i])) {
        this.reset()
      }
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      
      return (
        <ErrorRecovery 
          error={this.state.error} 
          onReset={this.reset}
        />
      )
    }

    return this.props.children
  }
}

// Error recovery component
interface ErrorRecoveryProps {
  error: Error | null
  onReset: () => void
}

export function ErrorRecovery({ error, onReset }: ErrorRecoveryProps) {
  const router = useRouter()

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-md border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            {georgianMessages.error.general}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AlertDescription className="text-muted-foreground">
            {error?.message || 'შეცდომა დაფიქსირდა გვერდის ჩატვირთვისას.'}
          </AlertDescription>
          
          {process.env.NODE_ENV !== 'production' && error && (
            <div className="mt-4 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-[200px]">
              <pre>{error.stack}</pre>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex gap-2 justify-end">
          <Button 
            variant="outline" 
            onClick={() => router.push('/')}
            className="flex items-center gap-1"
          >
            <Home className="h-4 w-4" />
            {georgianMessages.error.returnToHome}
          </Button>
          <Button 
            onClick={onReset}
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            სცადეთ ხელახლა
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

// Network error handler
export function useNetworkErrorHandler(options?: {
  onOffline?: () => void
  onOnline?: () => void
  retryInterval?: number
}) {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      options?.onOnline?.()
    }
    
    const handleOffline = () => {
      setIsOnline(false)
      options?.onOffline?.()
    }
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [options])
  
  // Show network status toast when status changes
  useEffect(() => {
    if (!isOnline) {
      warningToast(georgianMessages.error.checkConnection, {
        icon: <WifiOff className="h-4 w-4" />,
        duration: 0, // Persist until online
      })
    } else {
      errorToast('ინტერნეტთან კავშირი აღდგენილია', {
        icon: <Wifi className="h-4 w-4" />,
      })
    }
  }, [isOnline])
  
  return { isOnline }
}

// Validation error display
interface ValidationErrorProps {
  message: string
  fieldName?: string
}

export function ValidationError({ message, fieldName }: ValidationErrorProps) {
  return (
    <div 
      className="text-sm text-red-500 mt-1 flex items-center gap-1"
      style={{ animation: animations.shake }}
      id={fieldName ? `error-${fieldName}` : undefined}
      aria-live="polite"
    >
      <AlertCircle className="h-3 w-3 flex-shrink-0" />
      <span>{message}</span>
    </div>
  )
}

// Empty state design
interface EmptyStateProps {
  title: string
  description: string
  icon?: React.ReactNode
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      {icon && (
        <div className="mb-4 text-muted-foreground">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
      
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}

// 404 page design
export function NotFoundPage() {
  const router = useRouter()
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-4">
      <div className="text-6xl font-bold text-primary mb-4">404</div>
      <h1 className="text-2xl font-semibold mb-2">გვერდი ვერ მოიძებნა</h1>
      <p className="text-muted-foreground mb-6 text-center max-w-md">
        თქვენ მიერ მოთხოვნილი გვერდი არ არსებობს ან წაშლილია.
      </p>
      
      <Button 
        onClick={() => router.push('/')}
        className="flex items-center gap-2"
      >
        <Home className="h-4 w-4" />
        {georgianMessages.error.returnToHome}
      </Button>
    </div>
  )
}

// Retry logic with exponential backoff
export function useRetryLogic(
  callback: () => Promise<any>,
  options?: {
    maxRetries?: number
    initialDelay?: number
    maxDelay?: number
    onRetry?: (attempt: number, error: Error) => void
    onSuccess?: (result: any) => void
    onMaxRetriesReached?: (error: Error) => void
  }
) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    onRetry,
    onSuccess,
    onMaxRetriesReached,
  } = options || {}
  
  const [isRetrying, setIsRetrying] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [error, setError] = useState<Error | null>(null)
  
  const executeWithRetry = async () => {
    setIsRetrying(true)
    setAttempt(0)
    setError(null)
    
    let currentAttempt = 0
    let currentDelay = initialDelay
    
    const tryOperation = async (): Promise<any> => {
      try {
        const result = await callback()
        setIsRetrying(false)
        onSuccess?.(result)
        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        
        currentAttempt += 1
        
        if (currentAttempt < maxRetries) {
          // Calculate next delay with exponential backoff
          currentDelay = Math.min(currentDelay * 2, maxDelay)
          
          // Notify about retry
          setAttempt(currentAttempt)
          onRetry?.(currentAttempt, error)
          
          // Wait and retry
          await new Promise(resolve => setTimeout(resolve, currentDelay))
          return tryOperation()
        } else {
          setIsRetrying(false)
          onMaxRetriesReached?.(error)
          throw error
        }
      }
    }
    
    return tryOperation()
  }
  
  return {
    executeWithRetry,
    isRetrying,
    attempt,
    error,
    reset: () => {
      setIsRetrying(false)
      setAttempt(0)
      setError(null)
    },
  }
}
