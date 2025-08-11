'use client'

import { Fragment } from 'react'
import { ChevronRight, Home } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  href: string
  label: string
  isCurrentPage?: boolean
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[]
  className?: string
}

// Route configuration for automatic breadcrumb generation
const routeConfig: Record<string, string> = {
  '/dashboard': 'მთავარი',
  '/dashboard/invoices': 'ინვოისები',
  '/dashboard/invoices/new': 'ახალი ინვოისი',
  '/dashboard/clients': 'კლიენტები',
  '/dashboard/clients/new': 'ახალი კლიენტი',
  '/dashboard/analytics': 'ანალიტიკა',
  '/dashboard/settings': 'პარამეტრები'
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  const pathname = usePathname()

  // Generate breadcrumb items automatically if not provided
  const breadcrumbItems = items || generateBreadcrumbItems(pathname)

  if (breadcrumbItems.length <= 1) {
    return null
  }

  return (
    <nav
      className={cn('flex items-center space-x-1 text-sm text-muted-foreground', className)}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center space-x-1">
        {breadcrumbItems.map((item, index) => (
          <li key={item.href} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="w-4 h-4 mx-1 text-muted-foreground/60" />
            )}
            
            {item.isCurrentPage ? (
              <span 
                className="font-medium text-foreground"
                aria-current="page"
              >
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="hover:text-foreground transition-colors duration-200"
                prefetch={true}
              >
                {index === 0 && <Home className="w-3 h-3 mr-1 inline" />}
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

// Generate breadcrumb items from pathname
function generateBreadcrumbItems(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean)
  const items: BreadcrumbItem[] = []

  // Always start with dashboard
  items.push({
    href: '/dashboard',
    label: 'მთავარი'
  })

  let currentPath = ''
  
  for (let i = 0; i < segments.length; i++) {
    currentPath += '/' + segments[i]
    
    // Skip dashboard since we already added it
    if (currentPath === '/dashboard') continue

    const isLast = i === segments.length - 1
    let label = routeConfig[currentPath] || segments[i]

    // Handle dynamic routes (IDs)
    if (isUUID(segments[i]) || isInvoiceNumber(segments[i])) {
      // For dynamic routes, we'll need to get the actual name
      // This is a placeholder - in real app, you'd fetch the name
      if (currentPath.includes('/invoices/')) {
        label = segments[i] // Invoice number or ID
      } else if (currentPath.includes('/clients/')) {
        label = 'კლიენტი' // We'd fetch actual client name
      }
    }

    // Handle edit pages
    if (segments[i] === 'edit') {
      label = 'რედაქტირება'
    }

    items.push({
      href: currentPath,
      label: capitalizeFirst(label),
      isCurrentPage: isLast
    })
  }

  return items
}

// Utility functions
function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

function isInvoiceNumber(str: string): boolean {
  // Check if it looks like an invoice number (e.g., INV-001)
  return /^[A-Z]+-\d+$/i.test(str)
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// Custom breadcrumb hook for complex cases
export function useBreadcrumb() {
  const pathname = usePathname()

  const setBreadcrumb = (items: BreadcrumbItem[]) => {
    // This would typically store breadcrumb items in context or state
    // For now, we'll just return the items
    return items
  }

  const addBreadcrumb = (item: BreadcrumbItem) => {
    // Add a single breadcrumb item
    return item
  }

  return {
    pathname,
    setBreadcrumb,
    addBreadcrumb,
    generateBreadcrumbItems: () => generateBreadcrumbItems(pathname)
  }
}

// Breadcrumb separator component
export function BreadcrumbSeparator({ className }: { className?: string }) {
  return (
    <ChevronRight 
      className={cn('w-4 h-4 text-muted-foreground/60', className)} 
      aria-hidden="true" 
    />
  )
}

// Breadcrumb item component for custom usage
export function BreadcrumbItem({ 
  children, 
  className 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <li className={cn('flex items-center', className)}>
      {children}
    </li>
  )
}

// Breadcrumb link component
export function BreadcrumbLink({ 
  href, 
  children, 
  className 
}: { 
  href: string
  children: React.ReactNode
  className?: string 
}) {
  return (
    <Link
      href={href}
      className={cn(
        'hover:text-foreground transition-colors duration-200', 
        className
      )}
      prefetch={true}
    >
      {children}
    </Link>
  )
}

// Breadcrumb page component (current page)
export function BreadcrumbPage({ 
  children, 
  className 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <span 
      className={cn('font-medium text-foreground', className)}
      aria-current="page"
    >
      {children}
    </span>
  )
}

// Breadcrumb list component  
export function BreadcrumbList({ 
  children, 
  className 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <ol className={cn('flex items-center space-x-1', className)}>
      {children}
    </ol>
  )
}