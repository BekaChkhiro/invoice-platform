'use client'

import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

interface QueryProviderProps {
  children: React.ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // With SSR, we usually want to set some default staleTime
            // above 0 to avoid refetching immediately on the client
            staleTime: 60 * 1000, // 1 minute
            gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
            retry: (failureCount, error) => {
              // Don't retry on 4xx errors except 408, 409, 429
              if (error instanceof Error) {
                // Check if it's a network error or specific status codes
                const message = error.message.toLowerCase()
                if (message.includes('400') || message.includes('401') || message.includes('403') || message.includes('404')) {
                  return false
                }
              }
              return failureCount < 3
            },
            refetchOnWindowFocus: false, // Disable refetch on window focus
            refetchOnMount: true,
            refetchOnReconnect: true,
          },
          mutations: {
            retry: 1,
            // Global mutation error handling can be added here
            onError: (error) => {
              console.error('Mutation error:', error)
            },
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Only show devtools in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false}
          position="top-right"
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  )
}