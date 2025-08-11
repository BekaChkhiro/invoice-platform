import { useEffect, useRef } from 'react';
import { georgianMessages } from './loading-enhancements';

// Focus trap for modals and dialogs
export function useFocusTrap(isActive: boolean = true) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!isActive || !containerRef.current) return;
    
    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    // Set initial focus
    if (firstElement) {
      firstElement.focus();
    }
    
    // Handle tab key to trap focus
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };
    
    container.addEventListener('keydown', handleKeyDown);
    
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive]);
  
  return containerRef;
}

// Skip link component for accessibility
export interface SkipLinkProps {
  targetId: string;
  label?: string;
}

export const skipLinkStyles = {
  base: 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:p-4 focus:bg-background focus:text-foreground focus:outline-none focus:ring-2 focus:ring-primary',
};

// ARIA label helper
export function getAriaLabel(key: keyof typeof georgianMessages.accessibility): string {
  return georgianMessages.accessibility[key] || '';
}

// Keyboard shortcuts helper
export interface KeyboardShortcut {
  key: string;
  description: string;
  action: () => void;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in form fields
      if (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(
          (e.target as HTMLElement)?.tagName
        )
      ) {
        return;
      }
      
      const shortcut = shortcuts.find((s) => s.key === e.key);
      if (shortcut) {
        shortcut.action();
        e.preventDefault();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts]);
}

// Color contrast validator
export function validateColorContrast(
  foreground: string,
  background: string
): boolean {
  // This is a simplified version - in a real app, use a proper color contrast library
  // or the Web Content Accessibility Guidelines (WCAG) color contrast algorithm
  
  // Convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  };
  
  // Calculate relative luminance
  const luminance = (r: number, g: number, b: number) => {
    const a = [r, g, b].map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  };
  
  const rgb1 = hexToRgb(foreground);
  const rgb2 = hexToRgb(background);
  
  if (!rgb1 || !rgb2) return false;
  
  const l1 = luminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = luminance(rgb2.r, rgb2.g, rgb2.b);
  
  // WCAG AA requires a contrast ratio of at least 4.5:1 for normal text
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  return ratio >= 4.5;
}

// Accessibility attributes helper
export const ariaAttributes = {
  button: {
    create: {
      'aria-label': georgianMessages.accessibility.createInvoiceButton,
    },
    search: {
      'aria-label': georgianMessages.accessibility.searchField,
    },
    invoicesList: {
      'aria-label': georgianMessages.accessibility.invoicesList,
    },
  },
};

// Announce messages to screen readers
export function announceToScreenReader(message: string) {
  const announce = document.createElement('div');
  announce.setAttribute('aria-live', 'assertive');
  announce.setAttribute('aria-atomic', 'true');
  announce.classList.add('sr-only');
  announce.textContent = message;
  
  document.body.appendChild(announce);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announce);
  }, 1000);
}
