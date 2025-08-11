// This file contains types and utilities for production deployment setup

// Environment variables structure
export interface EnvironmentVariables {
  // Supabase configuration
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  
  // Application configuration
  NEXT_PUBLIC_APP_URL: string;
  NEXT_PUBLIC_APP_ENV: 'development' | 'staging' | 'production';
  
  // Email service configuration
  EMAIL_SERVER_HOST: string;
  EMAIL_SERVER_PORT: string;
  EMAIL_SERVER_USER: string;
  EMAIL_SERVER_PASSWORD: string;
  EMAIL_FROM: string;
  
  // Analytics and monitoring
  NEXT_PUBLIC_ANALYTICS_ID: string;
  NEXT_PUBLIC_ERROR_TRACKING_DSN: string;
  
  // Feature flags
  NEXT_PUBLIC_ENABLE_ANALYTICS: string;
  NEXT_PUBLIC_MAINTENANCE_MODE: string;
}

// Vercel deployment regions
export type VercelRegion = 
  | 'arn1' // Stockholm, Sweden
  | 'bom1' // Mumbai, India
  | 'cdg1' // Paris, France
  | 'cle1' // Cleveland, USA
  | 'dub1' // Dublin, Ireland
  | 'fra1' // Frankfurt, Germany
  | 'gru1' // São Paulo, Brazil
  | 'hnd1' // Tokyo, Japan
  | 'iad1' // Washington DC, USA
  | 'icn1' // Seoul, South Korea
  | 'lhr1' // London, UK
  | 'pdx1' // Portland, USA
  | 'sfo1' // San Francisco, USA
  | 'sin1' // Singapore
  | 'syd1'; // Sydney, Australia

// Deployment configuration
export interface DeploymentConfig {
  framework: 'nextjs';
  buildCommand: string;
  devCommand: string;
  installCommand: string;
  outputDirectory: string;
  regions: VercelRegion[];
  ignoreCommand: string;
}

// CDN configuration
export interface CDNConfig {
  headers: {
    source: string;
    headers: {
      key: string;
      value: string;
    }[];
  }[];
  cleanUrls: boolean;
  trailingSlash: boolean;
  redirects: {
    source: string;
    destination: string;
    permanent: boolean;
  }[];
}

// Default Vercel configuration
export const defaultVercelConfig: DeploymentConfig = {
  framework: 'nextjs',
  buildCommand: 'npm run build',
  devCommand: 'npm run dev',
  installCommand: 'npm ci',
  outputDirectory: '.next',
  regions: ['fra1'], // Frankfurt (closest to Georgia)
  ignoreCommand: 'git diff --quiet HEAD^ HEAD ./package-lock.json',
};

// Default CDN configuration
export const defaultCDNConfig: CDNConfig = {
  headers: [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()',
        },
      ],
    },
    {
      source: '/static/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
    {
      source: '/_next/static/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
    {
      source: '/_next/image(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
    {
      source: '/api/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      ],
    },
  ],
  cleanUrls: true,
  trailingSlash: false,
  redirects: [
    {
      source: '/home',
      destination: '/',
      permanent: true,
    },
  ],
};

// Monitoring setup
export interface MonitoringConfig {
  errorTracking: {
    dsn: string;
    tracesSampleRate: number;
    environment: string;
  };
  analytics: {
    trackingId: string;
    anonymizeIp: boolean;
  };
  performanceMonitoring: {
    enabled: boolean;
    reportingEndpoint: string;
  };
}

// Default monitoring configuration
export const defaultMonitoringConfig: MonitoringConfig = {
  errorTracking: {
    dsn: process.env.NEXT_PUBLIC_ERROR_TRACKING_DSN || '',
    tracesSampleRate: 0.2,
    environment: process.env.NEXT_PUBLIC_APP_ENV || 'development',
  },
  analytics: {
    trackingId: process.env.NEXT_PUBLIC_ANALYTICS_ID || '',
    anonymizeIp: true,
  },
  performanceMonitoring: {
    enabled: true,
    reportingEndpoint: '/api/vitals',
  },
};

// Database migration helper
export interface DatabaseMigrationConfig {
  projectId: string;
  connectionString: string;
  migrationsPath: string;
}

// Performance budgets
export const performanceBudgets = {
  firstContentfulPaint: 1800, // ms
  largestContentfulPaint: 2500, // ms
  timeToInteractive: 3800, // ms
  totalBlockingTime: 200, // ms
  cumulativeLayoutShift: 0.1, // unitless
  firstInputDelay: 100, // ms
  speedIndex: 3400, // ms
  totalByteWeight: 500 * 1024, // 500 KB
  maxJSParseTime: 100, // ms
};
