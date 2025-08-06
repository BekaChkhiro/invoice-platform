'use client'

import { QueryProvider } from '@/components/providers/query-provider'
import { Sidebar } from '@/components/layout/sidebar'
import { TopBar } from '@/components/layout/topbar'
import { MobileNav } from '@/components/layout/mobile-nav'
import { useKeyboardShortcuts } from '@/lib/hooks/use-keyboard-shortcuts'

interface DashboardWrapperProps {
  children: React.ReactNode
}

export function DashboardWrapper({ children }: DashboardWrapperProps) {
  // Initialize global keyboard shortcuts
  useKeyboardShortcuts()

  return (
    <QueryProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Desktop Layout */}
        <div className="hidden lg:flex">
          <Sidebar />
          <div className="flex-1 ml-[260px]">
            <TopBar />
            <main className="p-6 mt-16">
              {children}
            </main>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden">
          <TopBar mobile />
          <main className="p-4 pb-20">
            {children}
          </main>
          <MobileNav />
        </div>
      </div>
    </QueryProvider>
  )
}