export interface TestResult {
  success: boolean;
  message: string;
  duration: number;
  data?: any;
  error?: Error;
}

export interface TestSuite {
  name: string;
  tests: TestCase[];
  setup?: () => Promise<void>;
  teardown?: () => Promise<void>;
}

export interface TestCase {
  name: string;
  fn: () => Promise<TestResult>;
  timeout?: number;
  skip?: boolean;
}

export interface FormStep {
  step: 'client' | 'details' | 'items' | 'preview';
  data: any;
  validation?: (data: any) => boolean;
}

export interface ClientData {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  taxId?: string;
}

export interface CreditOperation {
  type: 'deduct' | 'return' | 'check';
  amount?: number;
  invoiceId?: string;
}

export interface EmailData {
  to: string;
  subject: string;
  body: string;
  attachments?: File[];
}

export interface PerformanceMetrics {
  pageLoadTime: number;
  apiResponseTime: number;
  pdfGenerationTime: number;
  searchTime: number;
  memoryUsage: number;
}

export interface TestConfig {
  baseUrl: string;
  apiUrl: string;
  timeout: number;
  retries: number;
  parallel: boolean;
  headless: boolean;
  viewport: {
    width: number;
    height: number;
  };
}

export interface ErrorTestScenario {
  name: string;
  type: 'network' | 'validation' | 'server' | 'auth' | 'permission';
  trigger: () => Promise<void>;
  expectedBehavior: string;
  recovery?: () => Promise<void>;
}

export interface MobileTestConfig extends TestConfig {
  deviceType: 'mobile' | 'tablet';
  orientation: 'portrait' | 'landscape';
  touchEnabled: boolean;
  hapticEnabled: boolean;
}

export interface UXTestStep {
  action: string;
  element: string;
  expected: string;
  timeout?: number;
}

export interface ProductionCheck {
  name: string;
  check: () => Promise<boolean>;
  critical: boolean;
  description: string;
}