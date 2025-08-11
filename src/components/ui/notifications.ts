import { toast } from 'sonner';
import { animations, georgianMessages } from './loading-enhancements';

// Enhanced toast notification types
type ToastType = 'success' | 'error' | 'warning' | 'info' | 'progress';

// Toast notification options
interface ToastOptions {
  duration?: number;
  position?: 'top-right' | 'top-center' | 'top-left' | 'bottom-right' | 'bottom-center' | 'bottom-left';
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  closeButton?: boolean;
  id?: string;
}

// Base toast function with animation
function showToast(
  message: string,
  type: ToastType,
  options?: ToastOptions
) {
  const defaultOptions = {
    duration: 4000,
    position: 'top-right',
    closeButton: true,
    ...options,
  };

  // Determine animation style based on type
  let animationStyle = {};
  switch (type) {
    case 'success':
      animationStyle = { animation: animations.success };
      break;
    case 'error':
      animationStyle = { animation: animations.error };
      break;
    case 'warning':
      animationStyle = { animation: animations.warning };
      break;
    case 'info':
      animationStyle = { animation: animations.info };
      break;
    default:
      animationStyle = { animation: animations.fadeIn };
  }

  // Show toast with appropriate styling
  return toast[type](message, {
    ...defaultOptions,
    style: {
      ...animationStyle,
    },
  });
}

// Success toast with checkmark animation
export function successToast(message: string, options?: ToastOptions) {
  return showToast(message, 'success', {
    icon: '✅',
    ...options,
  });
}

// Error toast with shake animation
export function errorToast(message: string, options?: ToastOptions) {
  return showToast(message, 'error', {
    icon: '❌',
    ...options,
  });
}

// Warning toast with attention pulse
export function warningToast(message: string, options?: ToastOptions) {
  return showToast(message, 'warning', {
    icon: '⚠️',
    ...options,
  });
}

// Info toast with slide-in effect
export function infoToast(message: string, options?: ToastOptions) {
  return showToast(message, 'info', {
    icon: 'ℹ️',
    ...options,
  });
}

// Progress toast for long operations
export function progressToast(
  message: string,
  promise: Promise<any>,
  options?: {
    loading?: string;
    success?: string;
    error?: string;
  }
) {
  return toast.promise(promise, {
    loading: options?.loading || 'მიმდინარეობს...',
    success: options?.success || 'წარმატებით დასრულდა',
    error: options?.error || 'შეცდომა დაფიქსირდა',
  });
}

// Georgian success message helpers
export const georgianToasts = {
  invoiceCreated: () => successToast(georgianMessages.success.invoiceCreated),
  clientAdded: () => successToast(georgianMessages.success.clientAdded),
  emailSent: () => successToast(georgianMessages.success.emailSent),
  fileUploaded: () => successToast(georgianMessages.success.fileUploaded),
  settingsSaved: () => successToast(georgianMessages.success.settingsSaved),
  
  // Error messages
  generalError: () => errorToast(georgianMessages.error.general),
  connectionError: () => errorToast(georgianMessages.error.checkConnection),
  retrying: () => infoToast(georgianMessages.error.retrying),
};

// Export Georgian messages for direct use
export { georgianMessages };
