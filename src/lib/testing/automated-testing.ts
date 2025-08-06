import { MasterTestRunner, runCriticalTestsOnly, runFullTestSuite } from './index';
import { TestConfig } from './types';

export class AutomatedTestingConfig {
  private config: TestConfig;

  constructor(config: Partial<TestConfig> = {}) {
    this.config = {
      baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      apiUrl: '/api',
      timeout: 30000,
      retries: 3,
      parallel: true,
      headless: true,
      viewport: { width: 1280, height: 720 },
      ...config
    };
  }

  // Pre-deployment test suite
  async runPreDeploymentTests(): Promise<boolean> {
    console.log('🚀 Running pre-deployment validation tests...\n');
    
    try {
      return await runCriticalTestsOnly(this.config);
    } catch (error) {
      console.error('❌ Pre-deployment tests failed:', error);
      return false;
    }
  }

  // Post-deployment verification
  async runPostDeploymentTests(): Promise<boolean> {
    console.log('✅ Running post-deployment verification tests...\n');
    
    const masterRunner = new MasterTestRunner({
      ...this.config,
      timeout: 10000, // Shorter timeout for production verification
      retries: 1
    });

    try {
      const results = await masterRunner.runCriticalTests();
      
      let allPassed = true;
      for (const [suiteName, suiteResults] of results) {
        const failed = suiteResults.filter((r: any) => !r.success).length;
        if (failed > 0) {
          allPassed = false;
          console.error(`❌ Post-deployment verification failed in ${suiteName}: ${failed} tests failed`);
        }
      }
      
      return allPassed;
      
    } catch (error) {
      console.error('❌ Post-deployment verification failed:', error);
      return false;
    }
  }

  // Continuous monitoring tests (lightweight)
  async runMonitoringTests(): Promise<{ healthy: boolean; issues: string[] }> {
    console.log('🔍 Running continuous monitoring tests...\n');
    
    const issues: string[] = [];
    
    try {
      // Quick health checks
      const healthChecks = [
        {
          name: 'API Health',
          check: async () => {
            const response = await fetch(`${this.config.baseUrl}${this.config.apiUrl}/user/credits`);
            return response.status !== 500;
          }
        },
        {
          name: 'Database Connectivity',
          check: async () => {
            const response = await fetch(`${this.config.baseUrl}${this.config.apiUrl}/clients`);
            return response.status !== 500;
          }
        },
        {
          name: 'Authentication System',
          check: async () => {
            const response = await fetch(`${this.config.baseUrl}/auth/callback`);
            return response.status !== 500;
          }
        }
      ];

      for (const healthCheck of healthChecks) {
        try {
          const isHealthy = await healthCheck.check();
          if (!isHealthy) {
            issues.push(`${healthCheck.name} is unhealthy`);
          }
        } catch (error) {
          issues.push(`${healthCheck.name} check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      const healthy = issues.length === 0;
      
      if (healthy) {
        console.log('✅ All monitoring checks passed');
      } else {
        console.warn(`⚠️ Monitoring detected ${issues.length} issues:`);
        issues.forEach(issue => console.warn(`  - ${issue}`));
      }

      return { healthy, issues };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      issues.push(`Monitoring system error: ${errorMessage}`);
      return { healthy: false, issues };
    }
  }

  // Performance regression tests
  async runPerformanceRegressionTests(): Promise<{ passed: boolean; metrics: any }> {
    console.log('⚡ Running performance regression tests...\n');
    
    const masterRunner = new MasterTestRunner(this.config);
    
    try {
      const results = await masterRunner.runPerformanceTests();
      
      const performanceResults = results.get('performance-testing') || [];
      const passed = performanceResults.filter((r: any) => r.success).length === performanceResults.length;
      
      // Extract key metrics
      const metrics = this.extractPerformanceMetrics(performanceResults);
      
      if (passed) {
        console.log('✅ Performance regression tests passed');
        console.log(`📊 Key metrics: Page load: ${metrics.pageLoadTime}ms, API: ${metrics.apiResponseTime}ms`);
      } else {
        console.warn('⚠️ Performance regression detected');
      }

      return { passed, metrics };

    } catch (error) {
      console.error('❌ Performance regression tests failed:', error);
      return { 
        passed: false, 
        metrics: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  private extractPerformanceMetrics(results: any[]): any {
    const metrics: any = {};
    
    for (const result of results) {
      if (result.data) {
        if (result.message.includes('Page load')) {
          metrics.pageLoadTime = result.data.averageLoadTime || -1;
        }
        if (result.message.includes('API performance')) {
          metrics.apiResponseTime = result.data.averageResponseTime || -1;
        }
        if (result.message.includes('PDF generation')) {
          metrics.pdfGenerationTime = result.data.averageGenerationTime || -1;
        }
        if (result.message.includes('Search performance')) {
          metrics.searchTime = result.data.averageSearchTime || -1;
        }
      }
    }
    
    return metrics;
  }

  // Generate CI/CD configuration
  generateGitHubActionsConfig(): string {
    return `name: Invoice Platform Testing

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  pre-deployment-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Setup test database
      run: |
        # Add Supabase setup commands here
        echo "Setting up test environment..."
    
    - name: Run pre-deployment tests
      env:
        NEXT_PUBLIC_SUPABASE_URL: \${{ secrets.SUPABASE_TEST_URL }}
        NEXT_PUBLIC_SUPABASE_ANON_KEY: \${{ secrets.SUPABASE_TEST_ANON_KEY }}
        SUPABASE_SERVICE_ROLE_KEY: \${{ secrets.SUPABASE_TEST_SERVICE_ROLE_KEY }}
      run: |
        npm run test:critical
    
    - name: Build application
      run: npm run build
      
  post-deployment-tests:
    runs-on: ubuntu-latest
    needs: pre-deployment-tests
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run post-deployment verification
      env:
        NEXT_PUBLIC_APP_URL: \${{ secrets.PRODUCTION_URL }}
      run: |
        npm run test:post-deployment
        
  performance-monitoring:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run performance regression tests
      env:
        NEXT_PUBLIC_APP_URL: \${{ secrets.PRODUCTION_URL }}
      run: |
        npm run test:performance
`;
  }

  // Generate package.json scripts
  generatePackageScripts(): Record<string, string> {
    return {
      "test:all": "node -e \"require('./src/lib/testing').runFullTestSuite()\"",
      "test:critical": "node -e \"const result = require('./src/lib/testing').runCriticalTestsOnly(); result.then(passed => process.exit(passed ? 0 : 1))\"",
      "test:performance": "node -e \"const config = new (require('./src/lib/testing/automated-testing').AutomatedTestingConfig)(); config.runPerformanceRegressionTests()\"",
      "test:post-deployment": "node -e \"const config = new (require('./src/lib/testing/automated-testing').AutomatedTestingConfig)(); config.runPostDeploymentTests().then(passed => process.exit(passed ? 0 : 1))\"",
      "test:monitor": "node -e \"const config = new (require('./src/lib/testing/automated-testing').AutomatedTestingConfig)(); config.runMonitoringTests()\"",
      "test:pre-deploy": "node -e \"const config = new (require('./src/lib/testing/automated-testing').AutomatedTestingConfig)(); config.runPreDeploymentTests().then(passed => process.exit(passed ? 0 : 1))\""
    };
  }

  // Vercel deployment hook integration
  generateVercelConfig(): any {
    return {
      "buildCommand": "npm run build",
      "installCommand": "npm ci",
      "devCommand": "npm run dev",
      "functions": {
        "src/pages/api/**/*.ts": {
          "maxDuration": 30
        }
      },
      "rewrites": [
        {
          "source": "/test-report",
          "destination": "/api/test-report"
        }
      ],
      "headers": [
        {
          "source": "/api/(.*)",
          "headers": [
            {
              "key": "Cache-Control",
              "value": "no-store, must-revalidate"
            }
          ]
        }
      ],
      "env": {
        "NEXT_PUBLIC_APP_URL": "@production-url"
      }
    };
  }
}

// Utility function for CI/CD integration
export async function runCITestPipeline(): Promise<boolean> {
  const config = new AutomatedTestingConfig();
  
  console.log('🔄 Running CI/CD test pipeline...\n');
  
  try {
    // Step 1: Pre-deployment tests
    console.log('Step 1: Pre-deployment validation...');
    const preDeploymentPassed = await config.runPreDeploymentTests();
    
    if (!preDeploymentPassed) {
      console.error('❌ Pre-deployment tests failed - blocking deployment');
      return false;
    }
    
    console.log('✅ Pre-deployment tests passed\n');
    
    // Step 2: Performance regression check
    console.log('Step 2: Performance regression check...');
    const { passed: performancePassed } = await config.runPerformanceRegressionTests();
    
    if (!performancePassed) {
      console.warn('⚠️ Performance regression detected - review recommended');
      // Don't block deployment for performance regression, but warn
    }
    
    console.log('✅ CI/CD pipeline completed successfully');
    return true;
    
  } catch (error) {
    console.error('❌ CI/CD pipeline failed:', error);
    return false;
  }
}

export default AutomatedTestingConfig;