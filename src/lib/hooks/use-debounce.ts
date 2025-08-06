'use client'

import { useState, useEffect } from 'react'

/**
 * Debounce hook that delays updating the returned value until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}