'use client'

import { useState, useRef, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: React.ReactNode
  className?: string
  disabled?: boolean
  threshold?: number
}

export function PullToRefresh({ 
  onRefresh, 
  children, 
  className,
  disabled = false,
  threshold = 80
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isPulling, setIsPulling] = useState(false)
  
  const startY = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = (e: TouchEvent) => {
    if (disabled || isRefreshing) return
    
    const scrollTop = containerRef.current?.scrollTop || 0
    if (scrollTop > 0) return
    
    startY.current = e.touches[0].clientY
    setIsPulling(true)
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (disabled || isRefreshing || !isPulling) return
    
    const scrollTop = containerRef.current?.scrollTop || 0
    if (scrollTop > 0) {
      setIsPulling(false)
      setPullDistance(0)
      return
    }
    
    const currentY = e.touches[0].clientY
    const distance = Math.max(0, (currentY - startY.current) * 0.5)
    
    if (distance > 0) {
      e.preventDefault()
      setPullDistance(Math.min(distance, threshold * 1.2))
    }
  }

  const handleTouchEnd = async () => {
    if (disabled || isRefreshing || !isPulling) return
    
    setIsPulling(false)
    
    if (pullDistance >= threshold) {
      setIsRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
        setPullDistance(0)
      }
    } else {
      setPullDistance(0)
    }
  }

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('touchstart', handleTouchStart, { passive: false })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd)

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isPulling, pullDistance, threshold, disabled, isRefreshing])

  const getRefreshState = () => {
    if (isRefreshing) return 'refreshing'
    if (pullDistance >= threshold) return 'ready'
    if (pullDistance > 0) return 'pulling'
    return 'idle'
  }

  const refreshState = getRefreshState()

  const getStatusText = () => {
    switch (refreshState) {
      case 'pulling':
        return 'ჩამოიტანეთ განახლებისთვის'
      case 'ready':
        return 'გაუშვით განახლებისთვის'
      case 'refreshing':
        return 'იტვირთება...'
      default:
        return ''
    }
  }

  return (
    <div ref={containerRef} className={cn('relative overflow-y-auto', className)}>
      {/* Pull to refresh indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <div 
          className="absolute top-0 left-0 right-0 z-10 flex items-center justify-center bg-gray-50 border-b border-gray-200 transition-all duration-200"
          style={{ 
            height: Math.max(pullDistance, isRefreshing ? threshold : 0),
            opacity: pullDistance > 20 || isRefreshing ? 1 : pullDistance / 20
          }}
        >
          <div className="flex flex-col items-center gap-2 py-4">
            <RefreshCw 
              className={cn(
                'w-5 h-5 text-gray-600 transition-transform duration-200',
                refreshState === 'refreshing' && 'animate-spin',
                refreshState === 'ready' && 'rotate-180'
              )}
            />
            <span className="text-xs text-gray-600 font-medium">
              {getStatusText()}
            </span>
          </div>
        </div>
      )}
      
      {/* Content */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling ? 'none' : 'transform 0.2s ease-out'
        }}
      >
        {children}
      </div>
    </div>
  )
}

// Hook for easier usage
export function usePullToRefresh(
  onRefresh: () => Promise<void>,
  options: { disabled?: boolean; threshold?: number } = {}
) {
  return {
    PullToRefreshWrapper: ({ children, className }: { children: React.ReactNode; className?: string }) => (
      <PullToRefresh
        onRefresh={onRefresh}
        className={className}
        disabled={options.disabled}
        threshold={options.threshold}
      >
        {children}
      </PullToRefresh>
    )
  }
}