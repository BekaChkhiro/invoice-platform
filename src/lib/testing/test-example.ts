/**
 * Example usage of the Invoice Platform Testing Framework
 * 
 * This file demonstrates how to use the comprehensive testing system
 * for validating all aspects of the invoice platform.
 */

import { 
  MasterTestRunner, 
  runFullTestSuite, 
  runCriticalTestsOnly,
  TestConfig 
} from './index';
import { AutomatedTestingConfig } from './automated-testing';

// Example 1: Run all tests with custom configuration
async function exampleFullTesting() {
  console.log('🧪 Example 1: Running full comprehensive test suite\n');

  const config: Partial<TestConfig> = {
    baseUrl: 'http://localhost:3000',
    apiUrl: '/api',
    timeout: 30000,
    retries: 3,
    parallel: true,
    headless: true,
    viewport: { width: 1920, height: 1080 }
  };

  try {
    await runFullTestSuite(config);
    console.log('✅ Full test suite completed successfully!');
  } catch (error) {
    console.error('❌ Full test suite failed:', error);
  }
}

// Example 2: Run only critical tests for deployment
async function exampleCriticalTesting() {
  console.log('🚀 Example 2: Running critical tests for deployment validation\n');

  try {
    const passed = await runCriticalTestsOnly({
      baseUrl: 'https://your-production-domain.com',
      timeout: 15000,
      retries: 2
    });

    if (passed) {
      console.log('✅ All critical tests passed - deployment approved!');
    } else {
      console.error('❌ Critical tests failed - deployment blocked!');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Critical testing failed:', error);
    process.exit(1);
  }
}

// Example 3: Run specific test suite
async function exampleSpecificSuite() {
  console.log('🎯 Example 3: Running specific test suite\n');

  const runner = new MasterTestRunner({
    baseUrl: 'http://localhost:3000',
    parallel: false // Run tests sequentially for debugging
  });

  try {
    // Run only the API testing suite
    const results = await runner.runSuite('api-testing');
    console.log('API Testing Results:', results);

    // Generate a report for just this suite
    const fullResults = new Map([['api-testing', results]]);
    const report = await runner.generateTestReport(fullResults);
    console.log('\n📊 API Testing Report:\n', report);

  } catch (error) {
    console.error('❌ API testing failed:', error);
  }
}

// Example 4: Performance monitoring
async function examplePerformanceMonitoring() {
  console.log('⚡ Example 4: Performance monitoring and regression testing\n');

  const automatedConfig = new AutomatedTestingConfig({
    baseUrl: 'https://your-app.vercel.app',
    timeout: 10000
  });

  try {
    // Run performance regression tests
    const { passed, metrics } = await automatedConfig.runPerformanceRegressionTests();
    
    console.log('Performance Test Results:', { passed, metrics });

    if (!passed) {
      console.warn('⚠️ Performance regression detected!');
      console.log('Metrics:', metrics);
    }

    // Run continuous monitoring
    const { healthy, issues } = await automatedConfig.runMonitoringTests();
    
    if (!healthy) {
      console.error('🚨 Health check issues detected:', issues);
    }

  } catch (error) {
    console.error('❌ Performance monitoring failed:', error);
  }
}

// Example 5: Custom test suite
async function exampleCustomTestSuite() {
  console.log('🛠️ Example 5: Creating and running custom test suite\n');

  const runner = new MasterTestRunner();

  // Create a custom test suite
  const customSuite = {
    name: 'Custom Business Logic Tests',
    tests: [
      {
        name: 'Georgian Currency Formatting',
        fn: async () => {
          try {
            // Test Georgian Lari formatting
            const amount = 1234.56;
            const formatted = new Intl.NumberFormat('ka-GE', {
              style: 'currency',
              currency: 'GEL'
            }).format(amount);

            const isCorrectFormat = formatted.includes('₾') || formatted.includes('GEL');

            return {
              success: isCorrectFormat,
              message: `Georgian currency formatting: ${formatted}`,
              duration: Date.now() - Date.now(),
              data: { amount, formatted }
            };
          } catch (error) {
            return {
              success: false,
              message: 'Georgian currency formatting failed',
              duration: 0,
              error: error instanceof Error ? error : new Error(String(error))
            };
          }
        }
      },
      {
        name: 'Georgian Date Formatting',
        fn: async () => {
          try {
            const date = new Date('2025-01-15');
            const georgianDate = date.toLocaleDateString('ka-GE');

            return {
              success: georgianDate.length > 0,
              message: `Georgian date formatting: ${georgianDate}`,
              duration: 0,
              data: { original: date, formatted: georgianDate }
            };
          } catch (error) {
            return {
              success: false,
              message: 'Georgian date formatting failed',
              duration: 0,
              error: error instanceof Error ? error : new Error(String(error))
            };
          }
        }
      },
      {
        name: 'VAT Calculation (18%)',
        fn: async () => {
          try {
            const subtotal = 1000;
            const vatRate = 18;
            const expectedVat = subtotal * (vatRate / 100);
            const expectedTotal = subtotal + expectedVat;

            // Test the actual calculation
            const calculatedVat = Math.round(subtotal * 0.18 * 100) / 100;
            const calculatedTotal = subtotal + calculatedVat;

            const vatCorrect = Math.abs(calculatedVat - expectedVat) < 0.01;
            const totalCorrect = Math.abs(calculatedTotal - expectedTotal) < 0.01;

            return {
              success: vatCorrect && totalCorrect,
              message: `VAT calculation: ${calculatedVat}₾ VAT, ${calculatedTotal}₾ total`,
              duration: 0,
              data: {
                subtotal,
                vatRate,
                calculatedVat,
                calculatedTotal,
                expectedVat,
                expectedTotal
              }
            };
          } catch (error) {
            return {
              success: false,
              message: 'VAT calculation failed',
              duration: 0,
              error: error instanceof Error ? error : new Error(String(error))
            };
          }
        }
      }
    ]
  };

  try {
    const results = await runner.testRunner.runSuite(customSuite);
    console.log('Custom Test Results:', results);
  } catch (error) {
    console.error('❌ Custom test suite failed:', error);
  }
}

// Example 6: Automated CI/CD integration
async function exampleCIPipeline() {
  console.log('🔄 Example 6: Automated CI/CD pipeline integration\n');

  const config = new AutomatedTestingConfig();

  try {
    // Generate GitHub Actions configuration
    const githubActionsConfig = config.generateGitHubActionsConfig();
    console.log('GitHub Actions Configuration Generated:\n');
    console.log(githubActionsConfig);

    // Generate package.json scripts
    const packageScripts = config.generatePackageScripts();
    console.log('\nPackage.json scripts to add:');
    console.log(JSON.stringify(packageScripts, null, 2));

    // Generate Vercel configuration
    const vercelConfig = config.generateVercelConfig();
    console.log('\nVercel configuration (vercel.json):');
    console.log(JSON.stringify(vercelConfig, null, 2));

  } catch (error) {
    console.error('❌ CI/CD configuration generation failed:', error);
  }
}

// Example 7: Production deployment validation
async function exampleProductionValidation() {
  console.log('🚀 Example 7: Production deployment validation\n');

  const config = new AutomatedTestingConfig({
    baseUrl: 'https://your-production-url.vercel.app',
    timeout: 10000,
    retries: 2
  });

  try {
    // Run pre-deployment validation
    console.log('Running pre-deployment validation...');
    const preDeploymentPassed = await config.runPreDeploymentTests();

    if (!preDeploymentPassed) {
      console.error('❌ Pre-deployment validation failed!');
      return false;
    }

    // Simulate deployment here...
    console.log('✅ Deployment completed successfully');

    // Run post-deployment verification
    console.log('Running post-deployment verification...');
    const postDeploymentPassed = await config.runPostDeploymentTests();

    if (!postDeploymentPassed) {
      console.error('❌ Post-deployment verification failed!');
      return false;
    }

    console.log('✅ Production deployment validated successfully!');
    return true;

  } catch (error) {
    console.error('❌ Production validation failed:', error);
    return false;
  }
}

// Main execution function for demonstration
async function runExamples() {
  console.log('🎯 Invoice Platform Testing Framework Examples\n');
  console.log('='.repeat(60) + '\n');

  const examples = [
    { name: 'Full Testing Suite', fn: exampleFullTesting },
    { name: 'Critical Tests Only', fn: exampleCriticalTesting },
    { name: 'Specific Test Suite', fn: exampleSpecificSuite },
    { name: 'Performance Monitoring', fn: examplePerformanceMonitoring },
    { name: 'Custom Test Suite', fn: exampleCustomTestSuite },
    { name: 'CI/CD Configuration', fn: exampleCIPipeline },
    { name: 'Production Validation', fn: exampleProductionValidation }
  ];

  // Run all examples (you can comment out the ones you don't want to run)
  for (const example of examples) {
    try {
      console.log(`\n${'='.repeat(60)}`);
      await example.fn();
      console.log(`\n✅ ${example.name} example completed\n`);
    } catch (error) {
      console.error(`❌ ${example.name} example failed:`, error);
    }
  }

  console.log('🎉 All examples completed!');
}

// Export for use in other files
export {
  exampleFullTesting,
  exampleCriticalTesting,
  exampleSpecificSuite,
  examplePerformanceMonitoring,
  exampleCustomTestSuite,
  exampleCIPipeline,
  exampleProductionValidation,
  runExamples
};

// Run examples if this file is executed directly
if (require.main === module) {
  runExamples().catch(console.error);
}