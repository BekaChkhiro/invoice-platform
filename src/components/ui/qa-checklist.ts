// Quality Assurance Checklist for Invoice Platform

// Cross-browser testing matrix
export const browserTestingMatrix = [
  {
    browser: 'Chrome',
    versions: ['Latest', 'Latest - 1'],
    platforms: ['Windows', 'macOS', 'Android'],
    priority: 'High',
  },
  {
    browser: 'Firefox',
    versions: ['Latest', 'Latest - 1'],
    platforms: ['Windows', 'macOS', 'Android'],
    priority: 'High',
  },
  {
    browser: 'Safari',
    versions: ['Latest', 'Latest - 1'],
    platforms: ['macOS', 'iOS'],
    priority: 'High',
  },
  {
    browser: 'Edge',
    versions: ['Latest'],
    platforms: ['Windows'],
    priority: 'Medium',
  },
  {
    browser: 'Samsung Internet',
    versions: ['Latest'],
    platforms: ['Android'],
    priority: 'Medium',
  },
];

// Device testing matrix
export const deviceTestingMatrix = [
  {
    type: 'Desktop',
    screenSizes: ['1920×1080', '1366×768', '2560×1440'],
    priority: 'High',
  },
  {
    type: 'Tablet',
    devices: ['iPad Pro', 'iPad', 'Samsung Galaxy Tab'],
    orientation: ['Portrait', 'Landscape'],
    priority: 'High',
  },
  {
    type: 'Mobile',
    devices: ['iPhone 14/15', 'iPhone SE', 'Samsung Galaxy S23', 'Google Pixel'],
    orientation: ['Portrait', 'Landscape'],
    priority: 'Critical',
  },
];

// Performance budgets
export const performanceBudgets = {
  lighthouse: {
    performance: 90,
    accessibility: 90,
    bestPractices: 90,
    seo: 90,
  },
  metrics: {
    firstContentfulPaint: 1800, // ms
    largestContentfulPaint: 2500, // ms
    timeToInteractive: 3800, // ms
    totalBlockingTime: 200, // ms
    cumulativeLayoutShift: 0.1, // unitless
  },
  size: {
    totalWeight: 500 * 1024, // 500 KB
    jsWeight: 200 * 1024, // 200 KB
    cssWeight: 50 * 1024, // 50 KB
    imageWeight: 200 * 1024, // 200 KB
    fontWeight: 50 * 1024, // 50 KB
  },
};

// Accessibility audit checklist
export const accessibilityChecklist = [
  {
    category: 'Keyboard Navigation',
    items: [
      'All interactive elements are keyboard accessible',
      'Focus order is logical and intuitive',
      'Focus styles are clearly visible',
      'No keyboard traps exist',
      'Skip links are implemented for main content',
    ],
  },
  {
    category: 'Screen Readers',
    items: [
      'All images have appropriate alt text',
      'Form inputs have associated labels',
      'ARIA landmarks are used appropriately',
      'Heading structure is logical (h1-h6)',
      'Dynamic content changes are announced',
    ],
  },
  {
    category: 'Visual Design',
    items: [
      'Color contrast meets WCAG AA standards (4.5:1 for normal text)',
      'UI is usable at 200% zoom',
      'Content is readable when text-only zoom is applied',
      'No information is conveyed by color alone',
      'Text can be resized without loss of functionality',
    ],
  },
  {
    category: 'Forms and Validation',
    items: [
      'Error messages are clear and descriptive',
      'Required fields are clearly indicated',
      'Form validation errors are associated with inputs',
      'Autocomplete attributes are used where appropriate',
      'Sufficient time is provided to complete forms',
    ],
  },
];

// Security audit checklist
export const securityChecklist = [
  {
    category: 'Authentication',
    items: [
      'Password requirements enforce strong passwords',
      'Multi-factor authentication is available',
      'Account lockout after failed attempts is implemented',
      'Password reset process is secure',
      'Session timeout is implemented appropriately',
    ],
  },
  {
    category: 'Data Protection',
    items: [
      'All API endpoints require proper authentication',
      'Sensitive data is not exposed in URLs',
      'HTTPS is enforced across the application',
      'Proper CORS policies are implemented',
      'Content Security Policy is configured',
    ],
  },
  {
    category: 'Input Validation',
    items: [
      'All user inputs are validated server-side',
      'Protection against SQL injection is implemented',
      'Protection against XSS attacks is implemented',
      'Protection against CSRF attacks is implemented',
      'File uploads are properly validated and sanitized',
    ],
  },
  {
    category: 'Error Handling',
    items: [
      'Error messages do not reveal sensitive information',
      'Custom error pages are implemented',
      'Application errors are logged securely',
      'Stack traces are not exposed to users',
      'Error handling does not create security vulnerabilities',
    ],
  },
];

// Pre-launch checklist
export const preLaunchChecklist = [
  {
    category: 'Functionality',
    items: [
      'All forms submit successfully',
      'All calculations are accurate',
      'All links work correctly',
      'Search functionality works as expected',
      'Pagination works correctly',
      'Filters and sorting work correctly',
      'CRUD operations work for all resources',
    ],
  },
  {
    category: 'Content',
    items: [
      'All Georgian text is properly displayed',
      'No placeholder content remains',
      'No spelling or grammar errors',
      'Legal pages (privacy policy, terms) are complete',
      'Contact information is accurate',
      'All images and media load correctly',
    ],
  },
  {
    category: 'User Experience',
    items: [
      'All animations are smooth (60fps)',
      'Loading states are implemented for all async operations',
      'Error states are handled gracefully',
      'Empty states are handled appropriately',
      'Responsive design works on all target devices',
      'Dark mode functions correctly',
    ],
  },
  {
    category: 'Technical',
    items: [
      'Environment variables are configured correctly',
      'Database migrations run successfully',
      'Backup and restore procedures are tested',
      'Monitoring is set up and functioning',
      'Analytics tracking is implemented correctly',
      'CI/CD pipeline is functioning correctly',
    ],
  },
];

// QA test execution helper
export interface TestCase {
  id: string;
  title: string;
  description: string;
  steps: string[];
  expectedResult: string;
  actualResult?: string;
  status?: 'Passed' | 'Failed' | 'Blocked' | 'Not Tested';
  severity?: 'Critical' | 'High' | 'Medium' | 'Low';
  assignedTo?: string;
  environment?: string;
  notes?: string;
}

// Sample critical test cases
export const criticalTestCases: TestCase[] = [
  {
    id: 'AUTH-001',
    title: 'User Login with Valid Credentials',
    description: 'Verify that users can log in with valid credentials',
    steps: [
      'Navigate to the login page',
      'Enter valid email and password',
      'Click the login button',
    ],
    expectedResult: 'User is successfully logged in and redirected to the dashboard',
    severity: 'Critical',
  },
  {
    id: 'INV-001',
    title: 'Create New Invoice',
    description: 'Verify that users can create a new invoice',
    steps: [
      'Log in to the application',
      'Navigate to Invoices section',
      'Click "Create New Invoice"',
      'Fill in all required fields',
      'Click "Save" button',
    ],
    expectedResult: 'Invoice is created successfully and appears in the invoice list',
    severity: 'Critical',
  },
  {
    id: 'PAY-001',
    title: 'Mark Invoice as Paid',
    description: 'Verify that users can mark an invoice as paid',
    steps: [
      'Log in to the application',
      'Navigate to Invoices section',
      'Select an unpaid invoice',
      'Click "Mark as Paid" button',
      'Confirm the action',
    ],
    expectedResult: 'Invoice status changes to "Paid" and dashboard metrics update accordingly',
    severity: 'Critical',
  },
  {
    id: 'MOBILE-001',
    title: 'Mobile Responsive Layout',
    description: 'Verify that the application is usable on mobile devices',
    steps: [
      'Access the application from a mobile device or emulator',
      'Navigate through main sections (Dashboard, Invoices, Clients)',
      'Create a new invoice',
      'View invoice details',
    ],
    expectedResult: 'All content is properly displayed and functional on mobile screens',
    severity: 'Critical',
  },
  {
    id: 'PERF-001',
    title: 'Dashboard Loading Performance',
    description: 'Verify that the dashboard loads within acceptable time limits',
    steps: [
      'Log in to the application',
      'Navigate to the Dashboard',
      'Measure time to interactive',
    ],
    expectedResult: 'Dashboard loads and becomes interactive within 3 seconds',
    severity: 'High',
  },
];

// Test execution report generator
export function generateTestReport(testCases: TestCase[]) {
  const summary = {
    total: testCases.length,
    passed: testCases.filter(tc => tc.status === 'Passed').length,
    failed: testCases.filter(tc => tc.status === 'Failed').length,
    blocked: testCases.filter(tc => tc.status === 'Blocked').length,
    notTested: testCases.filter(tc => tc.status === 'Not Tested').length,
    passRate: 0,
  };
  
  summary.passRate = (summary.passed / summary.total) * 100;
  
  return {
    summary,
    testCases,
    timestamp: new Date().toISOString(),
    executionTime: 0, // To be filled by the test runner
  };
}
