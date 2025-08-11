import { keyframes } from '@/lib/utils';

// Keyframes for animations
export const pulse = keyframes({
  '0%, 100%': { opacity: 1 },
  '50%': { opacity: 0.5 },
});

export const shimmer = keyframes({
  '0%': { backgroundPosition: '-200% 0' },
  '100%': { backgroundPosition: '200% 0' },
});

export const scaleUp = keyframes({
  '0%': { transform: 'scale(0.95)' },
  '100%': { transform: 'scale(1)' },
});

export const fadeIn = keyframes({
  '0%': { opacity: 0 },
  '100%': { opacity: 1 },
});

export const slideUp = keyframes({
  '0%': { transform: 'translateY(10px)', opacity: 0 },
  '100%': { transform: 'translateY(0)', opacity: 1 },
});

export const slideDown = keyframes({
  '0%': { transform: 'translateY(-10px)', opacity: 0 },
  '100%': { transform: 'translateY(0)', opacity: 1 },
});

export const shake = keyframes({
  '0%, 100%': { transform: 'translateX(0)' },
  '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-2px)' },
  '20%, 40%, 60%, 80%': { transform: 'translateX(2px)' },
});

export const bounce = keyframes({
  '0%, 100%': { transform: 'translateY(0)' },
  '50%': { transform: 'translateY(-5px)' },
});

export const spin = keyframes({
  '0%': { transform: 'rotate(0deg)' },
  '100%': { transform: 'rotate(360deg)' },
});

// Animation classes
export const animations = {
  // Page transitions
  pageEnter: `${fadeIn} 0.3s ease-out`,
  pageExit: `${fadeIn} 0.3s ease-out reverse`,
  
  // Modal animations
  modalEnter: `${scaleUp} 0.2s ease-out, ${fadeIn} 0.2s ease-out`,
  modalExit: `${scaleUp} 0.2s ease-out reverse, ${fadeIn} 0.2s ease-out reverse`,
  
  // List item animations
  listItemEnter: `${slideUp} 0.2s ease-out`,
  listItemExit: `${slideUp} 0.2s ease-out reverse`,
  
  // Feedback animations
  success: `${scaleUp} 0.2s ease-out`,
  error: `${shake} 0.4s ease-out`,
  warning: `${pulse} 1s ease-in-out infinite`,
  info: `${slideDown} 0.3s ease-out`,
  
  // Loading animations
  pulse: `${pulse} 1.5s ease-in-out infinite`,
  shimmer: `${shimmer} 2s infinite linear`,
  spin: `${spin} 1s linear infinite`,
  bounce: `${bounce} 0.8s ease-in-out infinite`,
};

// Micro-interaction classes
export const microInteractions = {
  // Button hover effects
  buttonHover: 'hover:scale-[1.02] hover:shadow-md transition-all duration-200',
  buttonActive: 'active:scale-[0.98] transition-all duration-100',
  
  // Card hover effects
  cardHover: 'hover:shadow-lg hover:translate-y-[-2px] transition-all duration-200',
  cardActive: 'active:shadow-md active:translate-y-[-1px] transition-all duration-100',
  
  // Input focus effects
  inputFocus: 'focus:ring-2 focus:ring-primary/20 transition-all duration-200',
  
  // Status badge animations
  statusBadgeSuccess: 'animate-pulse text-green-500',
  statusBadgeError: 'animate-pulse text-red-500',
  statusBadgeWarning: 'animate-pulse text-yellow-500',
  statusBadgeInfo: 'animate-pulse text-blue-500',
};

// Loading state classes
export const loadingStates = {
  // Skeleton with shimmer effect
  skeletonShimmer: 'bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]',
  
  // Pulse loading effect
  pulseLoading: 'animate-pulse',
  
  // Spinner loading
  spinnerLoading: 'animate-spin',
  
  // Bounce loading
  bounceLoading: 'animate-bounce',
};

// Georgian success messages
export const georgianMessages = {
  success: {
    invoiceCreated: "ინვოისი წარმატებით შეიქმნა! 🎉",
    clientAdded: "კლიენტი დაემატა სისტემაში ✅",
    emailSent: "ელ.ფოსტა გაიგზავნა 📧",
    fileUploaded: "ფაილი ატვირთულია 📁",
    settingsSaved: "პარამეტრები შენახულია 💾",
  },
  accessibility: {
    skipToContent: "გადასვლა მთავარ კონტენტზე",
    searchField: "ძებნის ველი",
    createInvoiceButton: "ღილაკი - ინვოისის შექმნა",
    invoicesList: "სია - ინვოისები",
  },
  error: {
    general: "სამწუხაროდ, რაღაც არასწორად წავიდა",
    checkConnection: "შეამოწმეთ ინტერნეტ კავშირი",
    retrying: "ვცდებით ხელახლა...",
    returnToHome: "უბრუნდით მთავარ გვერდზე",
  },
};
