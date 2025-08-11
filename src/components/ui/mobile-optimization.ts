import { useEffect, useState, useRef } from 'react';

// Touch optimization constants
export const TOUCH_TARGET_SIZE = 44; // Minimum touch target size in pixels (per WCAG)

// Touch optimization hook
export function useTouchOptimization() {
  useEffect(() => {
    // Add meta viewport tag for proper mobile scaling if not present
    let viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta');
      viewportMeta.setAttribute('name', 'viewport');
      viewportMeta.setAttribute(
        'content',
        'width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover'
      );
      document.head.appendChild(viewportMeta);
    }
    
    // Add touch-action CSS to improve touch responsiveness
    const style = document.createElement('style');
    style.textContent = `
      * {
        touch-action: manipulation;
      }
      
      button, a, input, select, textarea, [role="button"] {
        min-height: ${TOUCH_TARGET_SIZE}px;
        min-width: ${TOUCH_TARGET_SIZE}px;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  return {
    touchTargetSize: TOUCH_TARGET_SIZE,
  };
}

// Swipe gesture hook
interface SwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number; // Minimum distance in pixels
  preventDefaultTouchMove?: boolean;
}

export function useSwipeGesture(
  ref: React.RefObject<HTMLElement>,
  options: SwipeOptions
) {
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const touchEnd = useRef<{ x: number; y: number } | null>(null);
  
  const threshold = options.threshold || 50;
  
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    const handleTouchStart = (e: TouchEvent) => {
      touchStart.current = {
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY,
      };
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (options.preventDefaultTouchMove) {
        e.preventDefault();
      }
      
      touchEnd.current = {
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY,
      };
    };
    
    const handleTouchEnd = () => {
      if (!touchStart.current || !touchEnd.current) return;
      
      const distX = touchEnd.current.x - touchStart.current.x;
      const distY = touchEnd.current.y - touchStart.current.y;
      const absDistX = Math.abs(distX);
      const absDistY = Math.abs(distY);
      
      // Determine if it's a horizontal or vertical swipe
      if (absDistX > absDistY) {
        if (absDistX > threshold) {
          if (distX > 0) {
            options.onSwipeRight?.();
          } else {
            options.onSwipeLeft?.();
          }
        }
      } else {
        if (absDistY > threshold) {
          if (distY > 0) {
            options.onSwipeDown?.();
          } else {
            options.onSwipeUp?.();
          }
        }
      }
      
      // Reset
      touchStart.current = null;
      touchEnd.current = null;
    };
    
    element.addEventListener('touchstart', handleTouchStart);
    element.addEventListener('touchmove', handleTouchMove);
    element.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [ref, options, threshold]);
}

// Haptic feedback
export function useHapticFeedback() {
  const vibrate = (pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };
  
  return {
    light: () => vibrate(10),
    medium: () => vibrate(20),
    heavy: () => vibrate(30),
    success: () => vibrate([10, 30, 10]),
    error: () => vibrate([30, 20, 30, 20, 30]),
    warning: () => vibrate([20, 20, 20]),
  };
}

// Safe area handling for notch/dynamic island
export function useSafeAreaInsets() {
  const [insets, setInsets] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });
  
  useEffect(() => {
    // Check for environment support
    const supportsEnv = 'CSS' in window && 'supports' in CSS && CSS.supports('top: env(safe-area-inset-top)');
    
    if (supportsEnv) {
      // Get computed styles to read the CSS env() values
      const computeInset = (property: string) => {
        const div = document.createElement('div');
        div.style.position = 'fixed';
        div.style[property as any] = 'env(safe-area-inset-' + property + ')';
        div.style.width = '0';
        div.style.height = '0';
        document.body.appendChild(div);
        const inset = parseInt(getComputedStyle(div)[property as any], 10) || 0;
        document.body.removeChild(div);
        return inset;
      };
      
      setInsets({
        top: computeInset('top'),
        right: computeInset('right'),
        bottom: computeInset('bottom'),
        left: computeInset('left'),
      });
      
      // Add CSS variables for use in components
      document.documentElement.style.setProperty('--safe-area-inset-top', `${insets.top}px`);
      document.documentElement.style.setProperty('--safe-area-inset-right', `${insets.right}px`);
      document.documentElement.style.setProperty('--safe-area-inset-bottom', `${insets.bottom}px`);
      document.documentElement.style.setProperty('--safe-area-inset-left', `${insets.left}px`);
    }
  }, []);
  
  return insets;
}

// PWA optimization
export function setupPWA() {
  // Register service worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('ServiceWorker registration successful:', registration.scope);
        })
        .catch((error) => {
          console.error('ServiceWorker registration failed:', error);
        });
    });
  }
  
  // Add to home screen prompt
  let deferredPrompt: any;
  
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67+ from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
  });
  
  return {
    promptInstall: () => {
      if (deferredPrompt) {
        // Show the prompt
        deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('User accepted the install prompt');
          } else {
            console.log('User dismissed the install prompt');
          }
          deferredPrompt = null;
        });
      }
    },
  };
}

// Mobile-specific animations
export const mobileAnimations = {
  // Pull-to-refresh with smooth spring animation
  pullToRefresh: {
    initial: { y: 0 },
    pulling: (distance: number) => ({ y: Math.min(distance * 0.4, 80) }),
    refreshing: { y: 60 },
    complete: { y: 0 },
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 40,
    },
  },
  
  // Bottom sheet smooth transitions
  bottomSheet: {
    closed: { y: '100%' },
    open: { y: 0 },
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
  
  // FAB (Floating Action Button) morphing
  fab: {
    normal: { scale: 1, borderRadius: '50%' },
    expanded: { scale: 1.2, borderRadius: '25%' },
    transition: {
      duration: 0.2,
    },
  },
};
