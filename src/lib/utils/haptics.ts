/**
 * Haptic feedback utilities for mobile devices
 * Provides tactile feedback for user interactions
 */

export type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning'

class HapticsManager {
  private isSupported: boolean = false
  private vibrationAPI: boolean = false

  constructor() {
    // Check for haptic feedback support
    if (typeof window !== 'undefined') {
      // iOS haptic feedback
      this.isSupported = 'vibrate' in navigator || 'webkitVibrate' in navigator
      
      // Android vibration API
      this.vibrationAPI = 'vibrate' in navigator
    }
  }

  /**
   * Trigger haptic feedback with the specified pattern
   */
  public trigger(pattern: HapticPattern = 'light'): void {
    if (!this.isSupported) return

    try {
      // For iOS devices with Taptic Engine
      if ('webkitVibrate' in navigator) {
        this.triggerWebkitHaptics(pattern)
        return
      }

      // For Android devices with vibration API
      if (this.vibrationAPI) {
        this.triggerVibration(pattern)
        return
      }
    } catch (error) {
      console.warn('Haptic feedback failed:', error)
    }
  }

  /**
   * Trigger haptic feedback on button press
   */
  public buttonPress(): void {
    this.trigger('light')
  }

  /**
   * Trigger haptic feedback on selection change
   */
  public selectionChange(): void {
    this.trigger('medium')
  }

  /**
   * Trigger haptic feedback on success action
   */
  public success(): void {
    this.trigger('success')
  }

  /**
   * Trigger haptic feedback on error action
   */
  public error(): void {
    this.trigger('error')
  }

  /**
   * Trigger haptic feedback on warning action
   */
  public warning(): void {
    this.trigger('warning')
  }

  private triggerWebkitHaptics(pattern: HapticPattern): void {
    const navigator = window.navigator as any

    switch (pattern) {
      case 'light':
        if (navigator.webkitVibrate) navigator.webkitVibrate(10)
        break
      case 'medium':
        if (navigator.webkitVibrate) navigator.webkitVibrate(20)
        break
      case 'heavy':
        if (navigator.webkitVibrate) navigator.webkitVibrate(40)
        break
      case 'success':
        if (navigator.webkitVibrate) navigator.webkitVibrate(15)
        break
      case 'error':
        if (navigator.webkitVibrate) navigator.webkitVibrate([30, 10, 30])
        break
      case 'warning':
        if (navigator.webkitVibrate) navigator.webkitVibrate(25)
        break
    }
  }

  private triggerVibration(pattern: HapticPattern): void {
    if (!navigator.vibrate) return

    switch (pattern) {
      case 'light':
        navigator.vibrate(10)
        break
      case 'medium':
        navigator.vibrate(20)
        break
      case 'heavy':
        navigator.vibrate(40)
        break
      case 'success':
        navigator.vibrate([15, 10, 15])
        break
      case 'error':
        navigator.vibrate([50, 50, 50, 50, 50])
        break
      case 'warning':
        navigator.vibrate([25, 25, 25])
        break
    }
  }

  /**
   * Check if haptic feedback is supported
   */
  public get supported(): boolean {
    return this.isSupported
  }
}

// Singleton instance
const haptics = new HapticsManager()

// Hook for React components
export function useHaptics() {
  return {
    trigger: haptics.trigger.bind(haptics),
    buttonPress: haptics.buttonPress.bind(haptics),
    selectionChange: haptics.selectionChange.bind(haptics),
    success: haptics.success.bind(haptics),
    error: haptics.error.bind(haptics),
    warning: haptics.warning.bind(haptics),
    supported: haptics.supported
  }
}

// Direct exports for imperative usage
export const {
  trigger,
  buttonPress,
  selectionChange,
  success,
  error,
  warning
} = haptics

export { haptics }
export default haptics