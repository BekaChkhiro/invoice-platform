'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface UseKeyboardShortcutsProps {
  enableGlobalShortcuts?: boolean
  customShortcuts?: Record<string, () => void>
}

export function useKeyboardShortcuts({ 
  enableGlobalShortcuts = true,
  customShortcuts = {}
}: UseKeyboardShortcutsProps = {}) {
  const router = useRouter()

  useEffect(() => {
    if (!enableGlobalShortcuts) return

    const handleKeyDown = (event: KeyboardEvent) => {
      const isCtrlOrCmd = event.ctrlKey || event.metaKey
      const key = event.key ? event.key.toLowerCase() : ''

      // Don't trigger shortcuts in input fields
      const activeElement = document.activeElement
      const isInputFocused = activeElement?.tagName === 'INPUT' || 
                            activeElement?.tagName === 'TEXTAREA' ||
                            (activeElement as HTMLElement)?.contentEditable === 'true'

      // Global navigation shortcuts (work everywhere)
      if (isCtrlOrCmd) {
        switch (key) {
          case '1':
            event.preventDefault()
            router.push('/dashboard')
            toast.success('მთავარი გვერდი')
            return
          case '2':
            event.preventDefault()
            router.push('/dashboard/invoices')
            toast.success('ინვოისები')
            return
          case '3':
            event.preventDefault()
            router.push('/dashboard/clients')
            toast.success('კლიენტები')
            return
          case 'n':
            if (!isInputFocused) {
              event.preventDefault()
              if (window.location.pathname.includes('/invoices')) {
                router.push('/dashboard/invoices/new')
                toast.success('ახალი ინვოისი')
              } else if (window.location.pathname.includes('/clients')) {
                router.push('/dashboard/clients/new')
                toast.success('ახალი კლიენტი')
              }
            }
            return
          case 'f':
            if (!isInputFocused) {
              event.preventDefault()
              // Focus search input if available
              const searchInput = document.querySelector('input[placeholder*="ძებნა"], input[placeholder*="search"]') as HTMLInputElement
              if (searchInput) {
                searchInput.focus()
                toast.success('ძებნის ველი აქტიურია')
              }
            }
            return
          case '/':
            if (!isInputFocused) {
              event.preventDefault()
              // Focus search input
              const searchInput = document.querySelector('input[placeholder*="ძებნა"], input[placeholder*="search"]') as HTMLInputElement
              if (searchInput) {
                searchInput.focus()
                toast.success('ძებნის ველი აქტიურია')
              }
            }
            return
        }
      }

      // Non-Ctrl shortcuts (only when not in input fields)
      if (!isInputFocused && !isCtrlOrCmd) {
        switch (key) {
          case '?':
            event.preventDefault()
            showKeyboardShortcutsHelp()
            return
          case 'h':
            event.preventDefault()
            router.push('/dashboard')
            toast.success('მთავარი გვერდი')
            return
        }
      }

      // Custom shortcuts
      const shortcutKey = isCtrlOrCmd ? `ctrl+${key}` : key
      if (customShortcuts[shortcutKey] && !isInputFocused) {
        event.preventDefault()
        customShortcuts[shortcutKey]()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [router, customShortcuts, enableGlobalShortcuts])

  return {
    // Helper functions for components
    preventDefaultOnInputs: (callback: () => void) => {
      return (event: KeyboardEvent) => {
        const activeElement = document.activeElement
        const isInputFocused = activeElement?.tagName === 'INPUT' || 
                              activeElement?.tagName === 'TEXTAREA' ||
                              (activeElement as HTMLElement)?.contentEditable === 'true'
        
        if (!isInputFocused) {
          event.preventDefault()
          callback()
        }
      }
    }
  }
}

function showKeyboardShortcutsHelp() {
  // Create and show a modal with keyboard shortcuts
  const existingModal = document.getElementById('keyboard-shortcuts-modal')
  if (existingModal) {
    existingModal.remove()
  }

  const modal = document.createElement('div')
  modal.id = 'keyboard-shortcuts-modal'
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'
  modal.setAttribute('role', 'dialog')
  modal.setAttribute('aria-modal', 'true')
  
  const modalContent = `
    <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">კლავიატურის მალსახმობი</h3>
        <button id="close-shortcuts-modal" class="text-gray-400 hover:text-gray-600" type="button">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      
      <div class="space-y-3 text-sm">
        <div class="grid grid-cols-2 gap-2">
          <div class="flex items-center gap-2">
            <kbd class="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+1</kbd>
            <span>მთავარი</span>
          </div>
          <div class="flex items-center gap-2">
            <kbd class="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+2</kbd>
            <span>ინვოისები</span>
          </div>
          <div class="flex items-center gap-2">
            <kbd class="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+3</kbd>
            <span>კლიენტები</span>
          </div>
          <div class="flex items-center gap-2">
            <kbd class="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+N</kbd>
            <span>ახალი</span>
          </div>
          <div class="flex items-center gap-2">
            <kbd class="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+F</kbd>
            <span>ძებნა</span>
          </div>
          <div class="flex items-center gap-2">
            <kbd class="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+R</kbd>
            <span>განახლება</span>
          </div>
          <div class="flex items-center gap-2">
            <kbd class="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+A</kbd>
            <span>ყველას მონიშვნა</span>
          </div>
          <div class="flex items-center gap-2">
            <kbd class="px-2 py-1 bg-gray-100 rounded text-xs">Esc</kbd>
            <span>მონიშვნის გაუქმება</span>
          </div>
          <div class="flex items-center gap-2">
            <kbd class="px-2 py-1 bg-gray-100 rounded text-xs">H</kbd>
            <span>მთავარი</span>
          </div>
          <div class="flex items-center gap-2">
            <kbd class="px-2 py-1 bg-gray-100 rounded text-xs">?</kbd>
            <span>დახმარება</span>
          </div>
        </div>
      </div>
    </div>
  `

  modal.innerHTML = modalContent
  document.body.appendChild(modal)

  // Close modal handlers
  const closeModal = () => {
    if (modal.parentNode) {
      modal.remove()
    }
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal()
    }
  })

  const closeButton = document.getElementById('close-shortcuts-modal')
  if (closeButton) {
    closeButton.addEventListener('click', closeModal)
  }

  const escHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeModal()
      document.removeEventListener('keydown', escHandler)
    }
  }

  document.addEventListener('keydown', escHandler)
}

// Specific shortcut hooks for different pages
export function useInvoiceShortcuts() {
  return useKeyboardShortcuts({
    customShortcuts: {
      'ctrl+r': () => {
        // This will be handled by individual components
      },
      'ctrl+a': () => {
        // This will be handled by individual components
      },
      'escape': () => {
        // This will be handled by individual components
      }
    }
  })
}

export function useClientShortcuts() {
  return useKeyboardShortcuts({
    customShortcuts: {
      'ctrl+r': () => {
        // This will be handled by individual components
      },
      'ctrl+a': () => {
        // This will be handled by individual components
      },
      'escape': () => {
        // This will be handled by individual components
      }
    }
  })
}

export function useDashboardShortcuts() {
  return useKeyboardShortcuts({
    customShortcuts: {
      'ctrl+r': () => {
        // This will be handled by individual components
      }
    }
  })
}

export default useKeyboardShortcuts