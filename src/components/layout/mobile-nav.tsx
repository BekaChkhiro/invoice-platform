'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Home, FileText, Users, Plus, User, MoreHorizontal } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

import { cn } from '@/lib/utils'
import { useHaptics } from '@/lib/utils/haptics'

interface MobileNavItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  badge?: number
  disabled?: boolean
  primary?: boolean
}

interface FloatingActionItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  onClick: () => void
  color: string
}

export function MobileNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { buttonPress, selectionChange } = useHaptics()
  
  const [isVisible, setIsVisible] = useState(true)
  const [isScrolling, setIsScrolling] = useState(false)
  const [fabOpen, setFabOpen] = useState(false)

  useEffect(() => {
    let lastScrollY = window.scrollY
    let scrollTimeout: NodeJS.Timeout

    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const isScrollingDown = currentScrollY > lastScrollY && currentScrollY > 100

      setIsScrolling(true)
      setIsVisible(!isScrollingDown)
      lastScrollY = currentScrollY

      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => {
        setIsScrolling(false)
      }, 150)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      clearTimeout(scrollTimeout)
    }
  }, [])

  useEffect(() => {
    setFabOpen(false)
  }, [pathname])

  const navItems: MobileNavItem[] = [
    {
      id: 'dashboard',
      label: 'მთავარი',
      icon: Home,
      href: '/dashboard'
    },
    {
      id: 'invoices',
      label: 'ინვოისები',
      icon: FileText,
      href: '/dashboard/invoices'
    },
    {
      id: 'clients',
      label: 'კლიენტები',
      icon: Users,
      href: '/dashboard/clients'
    },
    {
      id: 'create',
      label: 'შექმნა',
      icon: Plus,
      href: '/dashboard/invoices/new',
      primary: true
    },
    {
      id: 'more',
      label: 'მეტი',
      icon: MoreHorizontal,
      href: '#'
    }
  ]

  const fabItems: FloatingActionItem[] = [
    {
      id: 'new-invoice',
      label: 'ახალი ინვოისი',
      icon: FileText,
      onClick: () => router.push('/dashboard/invoices/new'),
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      id: 'new-client',
      label: 'ახალი კლიენტი',
      icon: Users,
      onClick: () => router.push('/dashboard/clients/new'),
      color: 'bg-green-500 hover:bg-green-600'
    }
  ]

  const isActiveRoute = (href: string): boolean => {
    if (href === '/dashboard') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  const handleNavItemClick = (item: MobileNavItem) => {
    buttonPress() // Haptic feedback
    
    if (item.id === 'more') {
      // More menu will be handled by the Sheet component
      return
    }
    
    if (item.id === 'create') {
      setFabOpen(!fabOpen)
      return
    }
    
    router.push(item.href)
  }

  return (
    <>
      <motion.div
        initial={{ y: 0 }}
        animate={{ 
          y: isVisible ? 0 : 100,
          opacity: isVisible ? 1 : 0
        }}
        transition={{ 
          duration: 0.3,
          ease: 'easeInOut'
        }}
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      >
        <div className="bg-white border-t border-gray-200 px-2 py-1 safe-area-bottom">
          <div className="flex items-center justify-around">
            {navItems.map((item) => (
              item.id === 'more' ? (
                <MoreMenu key={item.id} trigger={
                  <NavItem
                    item={item}
                    isActive={false}
                    onClick={() => handleNavItemClick(item)}
                  />
                } />
              ) : (
                <NavItem
                  key={item.id}
                  item={item}
                  isActive={isActiveRoute(item.href)}
                  onClick={() => handleNavItemClick(item)}
                />
              )
            ))}
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {fabOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 z-40 md:hidden"
            onClick={() => setFabOpen(false)}
          >
            <div className="absolute bottom-20 right-4 flex flex-col-reverse gap-3">
              {fabItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ 
                    scale: 1, 
                    opacity: 1,
                    transition: { delay: index * 0.1 }
                  }}
                  exit={{ 
                    scale: 0, 
                    opacity: 0,
                    transition: { delay: (fabItems.length - index - 1) * 0.05 }
                  }}
                  className="flex items-center gap-3"
                >
                  <div className="bg-white px-3 py-2 rounded-full shadow-lg">
                    <span className="text-sm font-medium text-gray-700">
                      {item.label}
                    </span>
                  </div>
                  
                  <Button
                    size="icon"
                    className={`h-12 w-12 rounded-full shadow-lg ${item.color}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      buttonPress() // Haptic feedback
                      item.onClick()
                      setFabOpen(false)
                    }}
                  >
                    <item.icon className="h-5 w-5 text-white" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-16 md:hidden" />
    </>
  )
}

interface NavItemProps {
  item: MobileNavItem
  isActive: boolean
  onClick: () => void
}

function NavItem({ item, isActive, onClick }: NavItemProps) {
  const IconComponent = item.icon

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      disabled={item.disabled}
      className={cn(
        'flex flex-col items-center justify-center p-2 min-w-[60px] relative transition-colors duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-lg',
        isActive 
          ? 'text-primary' 
          : 'text-gray-500 hover:text-gray-700',
        item.disabled && 'opacity-50 cursor-not-allowed',
        item.primary && !isActive && 'text-primary/70'
      )}
    >
      <div className="relative">
        <IconComponent 
          className={cn(
            'h-6 w-6 transition-all duration-200',
            isActive && 'scale-110',
            item.primary && 'h-7 w-7'
          )} 
        />
        
        {item.badge && item.badge > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs p-0 min-w-[20px]"
          >
            {item.badge > 99 ? '99+' : item.badge}
          </Badge>
        )}
      </div>

      <span 
        className={cn(
          'text-xs mt-1 font-medium transition-colors duration-200',
          isActive ? 'text-primary' : 'text-gray-500'
        )}
      >
        {item.label}
      </span>

      {isActive && (
        <motion.div
          layoutId="activeTab"
          className="absolute -top-1 left-1/2 w-1 h-1 bg-primary rounded-full"
          style={{ x: '-50%' }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
    </motion.button>
  )
}

export function MoreMenu({ trigger }: { trigger: React.ReactNode }) {
  const router = useRouter()

  const moreItems = [
    {
      id: 'analytics',
      label: 'ანალიტიკა',
      icon: FileText,
      href: '/dashboard/analytics'
    },
    {
      id: 'settings',
      label: 'პარამეტრები',
      icon: User,
      href: '/dashboard/settings'
    },
    {
      id: 'reports',
      label: 'რეპორტები',
      icon: FileText,
      href: '/dashboard/reports'
    },
    {
      id: 'help',
      label: 'დახმარება',
      icon: Users,
      href: '/dashboard/help'
    }
  ]

  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger}
      </SheetTrigger>
      
      <SheetContent side="bottom" className="h-auto">
        <SheetHeader>
          <SheetTitle>მენიუ</SheetTitle>
          <SheetDescription>
            აირჩიეთ სასურველი გვერდი
          </SheetDescription>
        </SheetHeader>
        
        <div className="grid grid-cols-2 gap-4 mt-6">
          {moreItems.map((item) => (
            <Button
              key={item.id}
              variant="outline"
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => {
                router.push(item.href)
              }}
            >
              <item.icon className="h-6 w-6" />
              <span className="text-sm">{item.label}</span>
            </Button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}