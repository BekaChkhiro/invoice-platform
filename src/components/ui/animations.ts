import { animations, microInteractions } from './loading-enhancements';

// Page transition animations
export const pageTransitions = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.3, ease: 'easeInOut' },
};

// Modal animations
export const modalAnimations = {
  overlay: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 },
  },
  content: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: 0.2, ease: 'easeOut' },
  },
};

// List item animations
export const listItemAnimations = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, height: 0, overflow: 'hidden' },
  transition: (index: number) => ({
    duration: 0.2,
    delay: index * 0.05,
    ease: 'easeOut',
  }),
};

// Number counter animation
export function animateNumber(
  element: HTMLElement | null,
  start: number,
  end: number,
  duration: number = 1000
) {
  if (!element) return;
  
  const startTime = performance.now();
  const updateNumber = (currentTime: number) => {
    const elapsedTime = currentTime - startTime;
    const progress = Math.min(elapsedTime / duration, 1);
    const value = Math.floor(progress * (end - start) + start);
    
    element.textContent = value.toString();
    
    if (progress < 1) {
      requestAnimationFrame(updateNumber);
    } else {
      element.textContent = end.toString();
    }
  };
  
  requestAnimationFrame(updateNumber);
}

// Progress animations
export const progressAnimations = {
  initial: { width: '0%' },
  animate: (percentage: number) => ({ width: `${percentage}%` }),
  transition: { duration: 0.5, ease: 'easeOut' },
};

// Tailwind animation classes
export const tailwindAnimations = {
  slideUp: 'animate-slideUp',
  slideDown: 'animate-slideDown',
  scaleIn: 'animate-scaleIn',
  scaleOut: 'animate-scaleOut',
  fadeIn: 'animate-fadeIn',
  fadeOut: 'animate-fadeOut',
  bounce: 'animate-bounce',
  pulse: 'animate-pulse',
};

// Animation variants for Framer Motion
export const animationVariants = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  slideUp: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  },
  slideDown: {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 },
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
  },
  staggerChildren: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  },
};

// Hover and focus animations
export const hoverAnimations = {
  button: microInteractions.buttonHover,
  card: microInteractions.cardHover,
  input: microInteractions.inputFocus,
};

// Status badge animations
export const statusBadgeAnimations = {
  success: microInteractions.statusBadgeSuccess,
  error: microInteractions.statusBadgeError,
  warning: microInteractions.statusBadgeWarning,
  info: microInteractions.statusBadgeInfo,
};
