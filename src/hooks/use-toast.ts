import { useState, useCallback } from 'react'

export interface ToastProps {
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
  duration?: number
}

interface Toast extends ToastProps {
  id: string
}

let toastCounter = 0

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback(({ title, description, variant = 'default', duration = 5000 }: ToastProps) => {
    const id = (++toastCounter).toString()
    const newToast: Toast = {
      id,
      title,
      description,
      variant,
      duration
    }

    setToasts((prev) => [...prev, newToast])

    // Auto remove toast after duration
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, duration)

    return id
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return {
    toast,
    dismiss,
    toasts
  }
}

// Simple toast notification function for immediate use
export function showToast({ title, description, variant = 'default' }: ToastProps) {
  // Create a simple alert-based toast for immediate use
  const message = [title, description].filter(Boolean).join('\n')
  
  if (variant === 'destructive') {
    alert(`❌ შეცდომა: ${message}`)
  } else {
    alert(`✅ ${message}`)
  }
}