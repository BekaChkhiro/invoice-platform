'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Smartphone, Monitor } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

interface PWAInstallButtonProps {
  variant?: 'default' | 'outline' | 'secondary'
  size?: 'default' | 'sm' | 'lg'
  className?: string
  showIcon?: boolean
  children?: React.ReactNode
}

export default function PWAInstallButton({
  variant = 'default',
  size = 'default',
  className = '',
  showIcon = true,
  children
}: PWAInstallButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isInstallable, setIsInstallable] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Check if running as PWA
    if (window.navigator.standalone === true) {
      setIsInstalled(true)
      return
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      const installEvent = e as BeforeInstallPromptEvent
      setDeferredPrompt(installEvent)
      setIsInstallable(true)
    }

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      // Show the install prompt
      await deferredPrompt.prompt()
      
      // Wait for user choice
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('PWA installed successfully')
      } else {
        console.log('PWA installation dismissed')
      }
      
      // Clear the prompt
      setDeferredPrompt(null)
      setIsInstallable(false)
    } catch (error) {
      console.error('Error installing PWA:', error)
    }
  }

  // Don't show button if already installed
  if (isInstalled) {
    return null
  }

  // Don't show button if not installable
  if (!isInstallable) {
    return null
  }

  const getIcon = () => {
    if (!showIcon) return null
    
    // Detect device type for appropriate icon
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
    
    return isMobile ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />
  }

  const getDefaultText = () => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
    
    return isMobile ? 'ტელეფონში ინსტალაცია' : 'დესკტოპზე ინსტალაცია'
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleInstallClick}
    >
      {getIcon()}
      {children || getDefaultText()}
    </Button>
  )
}