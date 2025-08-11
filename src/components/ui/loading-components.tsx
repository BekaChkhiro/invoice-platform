'use client'

import { Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { animations, loadingStates, microInteractions } from './loading-enhancements'

// PulseLoader - Smooth pulsing animation for buttons
export function PulseLoader({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center space-x-1', className)}>
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className="w-2 h-2 bg-primary rounded-full"
          style={{
            animation: `${animations.pulse}`,
            animationDelay: `${index * 0.2}s`,
            animationDuration: '1.5s',
            animationIterationCount: 'infinite'
          }}
        />
      ))}
    </div>
  )
}

// SkeletonCard - Card-shaped skeleton with shimmer effect
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardContent className="p-4 overflow-hidden">
        <div className="space-y-3">
          <Skeleton 
            className={cn(
              'h-5 w-3/4',
              loadingStates.skeletonShimmer,
              'animate-[shimmer_2s_infinite_linear]'
            )} 
          />
          <Skeleton 
            className={cn(
              'h-4 w-1/2',
              loadingStates.skeletonShimmer,
              'animate-[shimmer_2s_infinite_linear]'
            )} 
          />
          <Skeleton 
            className={cn(
              'h-20 w-full',
              loadingStates.skeletonShimmer,
              'animate-[shimmer_2s_infinite_linear]'
            )} 
          />
          <div className="flex justify-between gap-2">
            <Skeleton 
              className={cn(
                'h-4 w-1/4',
                loadingStates.skeletonShimmer,
                'animate-[shimmer_2s_infinite_linear]'
              )} 
            />
            <Skeleton 
              className={cn(
                'h-4 w-1/4',
                loadingStates.skeletonShimmer,
                'animate-[shimmer_2s_infinite_linear]'
              )} 
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// TableSkeleton - Intelligent table skeleton matching real content
interface TableSkeletonProps {
  rows?: number
  columns?: number
  hasHeader?: boolean
  hasActions?: boolean
  className?: string
}

export function TableSkeleton({ 
  rows = 5, 
  columns = 4, 
  hasHeader = true,
  hasActions = true,
  className 
}: TableSkeletonProps) {
  return (
    <div className={cn('w-full space-y-3', className)}>
      {/* Header */}
      {hasHeader && (
        <div className="flex items-center space-x-4 pb-2 border-b">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton 
              key={`header-${colIndex}`}
              className={cn(
                'h-5',
                colIndex === 0 ? 'w-8' : 'flex-1',
                colIndex === columns - 1 && hasActions ? 'w-20' : '',
                loadingStates.skeletonShimmer,
                'animate-[shimmer_2s_infinite_linear]'
              )} 
            />
          ))}
        </div>
      )}
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div 
          key={`row-${rowIndex}`} 
          className="flex items-center space-x-4 py-3"
          style={{ 
            animation: `${animations.fadeIn}`,
            animationDelay: `${rowIndex * 0.05}s`,
            animationDuration: '0.3s',
            animationFillMode: 'both'
          }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton 
              key={`cell-${rowIndex}-${colIndex}`}
              className={cn(
                'h-4',
                colIndex === 0 ? 'w-8' : 'flex-1',
                colIndex === columns - 1 && hasActions ? 'w-20' : '',
                loadingStates.skeletonShimmer,
                'animate-[shimmer_2s_infinite_linear]'
              )} 
            />
          ))}
        </div>
      ))}
    </div>
  )
}

// FormSkeleton - Form-specific loading with field placeholders
interface FormSkeletonProps {
  fields?: number
  hasButtons?: boolean
  hasLabels?: boolean
  className?: string
}

export function FormSkeleton({ 
  fields = 4, 
  hasButtons = true,
  hasLabels = true,
  className 
}: FormSkeletonProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {Array.from({ length: fields }).map((_, index) => (
        <div 
          key={`field-${index}`} 
          className="space-y-2"
          style={{ 
            animation: `${animations.fadeIn}`,
            animationDelay: `${index * 0.05}s`,
            animationDuration: '0.3s',
            animationFillMode: 'both'
          }}
        >
          {hasLabels && (
            <Skeleton 
              className={cn(
                'h-4 w-24',
                loadingStates.skeletonShimmer,
                'animate-[shimmer_2s_infinite_linear]'
              )} 
            />
          )}
          <Skeleton 
            className={cn(
              'h-10 w-full',
              loadingStates.skeletonShimmer,
              'animate-[shimmer_2s_infinite_linear]'
            )} 
          />
        </div>
      ))}
      
      {hasButtons && (
        <div className="flex gap-2 pt-2">
          <Skeleton 
            className={cn(
              'h-10 w-24',
              loadingStates.skeletonShimmer,
              'animate-[shimmer_2s_infinite_linear]'
            )} 
          />
          <Skeleton 
            className={cn(
              'h-10 w-24',
              loadingStates.skeletonShimmer,
              'animate-[shimmer_2s_infinite_linear]'
            )} 
          />
        </div>
      )}
    </div>
  )
}

// ChartSkeleton - Analytics chart loading placeholder
interface ChartSkeletonProps {
  height?: number
  hasLegend?: boolean
  className?: string
}

export function ChartSkeleton({ 
  height = 200, 
  hasLegend = true,
  className 
}: ChartSkeletonProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Chart title */}
      <Skeleton 
        className={cn(
          'h-5 w-1/3',
          loadingStates.skeletonShimmer,
          'animate-[shimmer_2s_infinite_linear]'
        )} 
      />
      
      {/* Chart area */}
      <div className="relative">
        <Skeleton 
          className={cn(
            'w-full',
            loadingStates.skeletonShimmer,
            'animate-[shimmer_2s_infinite_linear]'
          )}
          style={{ height: `${height}px` }}
        />
        
        {/* Simulated chart lines */}
        <div 
          className="absolute inset-0 flex items-end justify-between px-4"
          style={{ bottom: '10%' }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div 
              key={`bar-${i}`}
              className="bg-gray-300/30 w-8 rounded-t"
              style={{ 
                height: `${20 + Math.random() * 60}%`,
                animation: `${animations.fadeIn}`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: '0.5s',
                animationFillMode: 'both'
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Legend */}
      {hasLegend && (
        <div className="flex gap-4 pt-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={`legend-${i}`} className="flex items-center gap-2">
              <Skeleton 
                className={cn(
                  'h-3 w-3',
                  loadingStates.skeletonShimmer,
                  'animate-[shimmer_2s_infinite_linear]'
                )} 
              />
              <Skeleton 
                className={cn(
                  'h-3 w-16',
                  loadingStates.skeletonShimmer,
                  'animate-[shimmer_2s_infinite_linear]'
                )} 
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
