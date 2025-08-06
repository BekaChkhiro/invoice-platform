import { TestRunner } from './test-runner';
import { TestSuite, TestConfig } from './types';

// Import all test suites
import { createFormTestingSuite } from './form-testing';
import { createAPITestingSuite } from './api-testing';
import { createRealtimeTestingSuite } from './realtime-testing';
import { createEdgeCaseTestingSuite } from './edge-case-testing';
import { createPerformanceTestingSuite } from './performance-testing';
import { createProductionReadinessSuite } from './production-readiness';

export class MasterTestRunner {
  private testRunner: TestRunner;
  private suites: Map<string, TestSuite> = new Map();

  constructor(config: Partial<TestConfig> = {}) {
    this.testRunner = new TestRunner(config);
    this.initializeTestSuites();
  }

  private initializeTestSuites(): void {
    // Core functionality tests (highest priority)
    this.suites.set('form-testing', createFormTestingSuite());
    this.suites.set('api-testing', createAPITestingSuite());
    
    // Production readiness (critical for deployment)
    this.suites.set('production-readiness', createProductionReadinessSuite());
    
    // Performance and reliability tests
    this.suites.set('performance-testing', createPerformanceTestingSuite());
    this.suites.set('realtime-testing', createRealtimeTestingSuite());
    
    // Edge cases and robustness
    this.suites.set('edge-case-testing', createEdgeCaseTestingSuite());
  }

  async runAllTests(): Promise<Map<string, any>> {
    console.log('🚀 Starting comprehensive invoice platform testing...\n');
    
    const allSuites = Array.from(this.suites.values());
    return await this.testRunner.runAllSuites(allSuites);
  }

  async runCriticalTests(): Promise<Map<string, any>> {
    console.log('⚡ Running critical tests for deployment validation...\n');
    
    const criticalSuites = [
      this.suites.get('form-testing')!,
      this.suites.get('api-testing')!,
      this.suites.get('production-readiness')!
    ];
    
    return await this.testRunner.runAllSuites(criticalSuites);
  }

  async runPerformanceTests(): Promise<Map<string, any>> {
    console.log('⚡ Running performance and reliability tests...\n');
    
    const performanceSuites = [
      this.suites.get('performance-testing')!,
      this.suites.get('realtime-testing')!
    ];
    
    return await this.testRunner.runAllSuites(performanceSuites);
  }

  async runRobustnessTests(): Promise<Map<string, any>> {
    console.log('🛡️ Running robustness and edge case tests...\n');
    
    const robustnessSuites = [
      this.suites.get('edge-case-testing')!
    ];
    
    return await this.testRunner.runAllSuites(robustnessSuites);
  }

  async runSuite(suiteName: string): Promise<any> {
    const suite = this.suites.get(suiteName);
    if (!suite) {
      throw new Error(`Test suite '${suiteName}' not found. Available suites: ${Array.from(this.suites.keys()).join(', ')}`);
    }
    
    console.log(`🧪 Running ${suite.name} test suite...\n`);
    return await this.testRunner.runSuite(suite);
  }

  getAvailableSuites(): string[] {
    return Array.from(this.suites.keys());
  }

  async generateTestReport(results: Map<string, any>): Promise<string> {
    console.log('\n📊 Generating comprehensive test report...\n');

    const timestamp = new Date().toISOString();
    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;
    let totalDuration = 0;

    const suiteReports: string[] = [];

    for (const [suiteName, suiteResults] of results) {
      const passed = suiteResults.filter((r: any) => r.success).length;
      const failed = suiteResults.filter((r: any) => r.success === false).length;
      const duration = suiteResults.reduce((sum: number, r: any) => sum + r.duration, 0);
      
      totalTests += suiteResults.length;
      totalPassed += passed;
      totalFailed += failed;
      totalDuration += duration;

      const successRate = ((passed / suiteResults.length) * 100).toFixed(1);
      
      suiteReports.push(`
## ${suiteName.replace('-', ' ').toUpperCase()}

- **Tests**: ${suiteResults.length}
- **Passed**: ${passed} ✅
- **Failed**: ${failed} ❌
- **Success Rate**: ${successRate}%
- **Duration**: ${duration}ms

### Test Results:
${suiteResults.map((result: any, index: number) => 
  `${index + 1}. ${result.success ? '✅' : '❌'} ${result.message} (${result.duration}ms)`
).join('\n')}

### Failed Tests:
${suiteResults
  .filter((r: any) => !r.success)
  .map((result: any) => `- ❌ ${result.message}${result.error ? `: ${result.error.message}` : ''}`)
  .join('\n') || 'None 🎉'}
      `);
    }

    const overallSuccessRate = ((totalPassed / totalTests) * 100).toFixed(1);
    const report = `
# 🧪 Invoice Platform Test Report

**Generated**: ${timestamp}  
**Environment**: ${process.env.NODE_ENV || 'development'}  
**Base URL**: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}

## 📈 Overall Summary

- **Total Test Suites**: ${results.size}
- **Total Tests**: ${totalTests}
- **Passed**: ${totalPassed} ✅
- **Failed**: ${totalFailed} ❌
- **Success Rate**: ${overallSuccessRate}%
- **Total Duration**: ${Math.round(totalDuration / 1000)}s

## 🎯 Test Results by Category

${suiteReports.join('\n')}

## 🚀 Production Readiness Assessment

${this.generateReadinessAssessment(overallSuccessRate, totalFailed, results)}

## 🔧 Recommendations

${this.generateRecommendations(results)}

---

*Generated by Invoice Platform Testing Framework*
    `;

    return report;
  }

  private generateReadinessAssessment(successRate: string, failedCount: number, results: Map<string, any>): string {
    const rate = parseFloat(successRate);
    
    if (rate >= 95 && failedCount === 0) {
      return `🟢 **PRODUCTION READY** - All systems green! The platform is ready for production deployment.`;
    } else if (rate >= 85 && failedCount <= 3) {
      return `🟡 **MOSTLY READY** - The platform is largely ready but has some minor issues that should be addressed.`;
    } else if (rate >= 70) {
      return `🟠 **NEEDS WORK** - Several issues need to be resolved before production deployment.`;
    } else {
      return `🔴 **NOT READY** - Critical issues must be resolved. Do not deploy to production.`;
    }
  }

  private generateRecommendations(results: Map<string, any>): string {
    const recommendations: string[] = [];
    
    // Check production readiness suite
    const productionResults = results.get('production-readiness');
    if (productionResults) {
      const failedProdTests = productionResults.filter((r: any) => !r.success);
      if (failedProdTests.length > 0) {
        recommendations.push('🔴 **Critical**: Fix production readiness issues before deployment');
      }
    }

    // Check API testing
    const apiResults = results.get('api-testing');
    if (apiResults) {
      const failedApiTests = apiResults.filter((r: any) => !r.success);
      if (failedApiTests.length > 0) {
        recommendations.push('🟠 **High Priority**: Resolve API integration issues');
      }
    }

    // Check performance
    const perfResults = results.get('performance-testing');
    if (perfResults) {
      const failedPerfTests = perfResults.filter((r: any) => !r.success);
      if (failedPerfTests.length > 0) {
        recommendations.push('🟡 **Medium Priority**: Optimize performance bottlenecks');
      }
    }

    // Check edge cases
    const edgeResults = results.get('edge-case-testing');
    if (edgeResults) {
      const failedEdgeTests = edgeResults.filter((r: any) => !r.success);
      if (failedEdgeTests.length > 0) {
        recommendations.push('🔵 **Low Priority**: Address edge case handling for better robustness');
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('🎉 **Excellent!** No major issues detected. Consider minor optimizations for enhanced performance.');
    }

    return recommendations.join('\n');
  }

  exportResults(results: Map<string, any>, format: 'json' | 'html' | 'markdown' = 'json'): string {
    if (format === 'markdown') {
      return this.generateTestReport(results).then(report => report).catch(() => 'Error generating report');
    }
    
    return this.testRunner.exportResults(format);
  }
}

// Convenience functions for easy usage
export async function runFullTestSuite(config?: Partial<TestConfig>): Promise<void> {
  const masterRunner = new MasterTestRunner(config);
  
  try {
    const results = await masterRunner.runAllTests();
    const report = await masterRunner.generateTestReport(results);
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST REPORT SUMMARY');
    console.log('='.repeat(80));
    
    const lines = report.split('\n');
    const summaryStart = lines.findIndex(line => line.includes('Overall Summary'));
    const summaryEnd = lines.findIndex(line => line.includes('Test Results by Category'));
    
    if (summaryStart !== -1 && summaryEnd !== -1) {
      console.log(lines.slice(summaryStart, summaryEnd).join('\n'));
    }
    
    console.log('='.repeat(80));
    
    // Save detailed report to file if in Node.js environment
    if (typeof window === 'undefined') {
      const fs = require('fs');
      const path = require('path');
      const reportsDir = path.join(process.cwd(), 'test-reports');
      
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }
      
      const reportPath = path.join(reportsDir, `test-report-${Date.now()}.md`);
      fs.writeFileSync(reportPath, report);
      
      console.log(`📄 Detailed report saved to: ${reportPath}`);
    }
    
  } catch (error) {
    console.error('❌ Test suite execution failed:', error);
    throw error;
  }
}

export async function runCriticalTestsOnly(config?: Partial<TestConfig>): Promise<boolean> {
  const masterRunner = new MasterTestRunner(config);
  
  try {
    const results = await masterRunner.runCriticalTests();
    
    let allPassed = true;
    for (const [suiteName, suiteResults] of results) {
      const failed = suiteResults.filter((r: any) => !r.success).length;
      if (failed > 0) {
        allPassed = false;
        console.error(`❌ Critical test failures in ${suiteName}: ${failed} tests failed`);
      }
    }
    
    if (allPassed) {
      console.log('✅ All critical tests passed - ready for deployment!');
    } else {
      console.error('❌ Critical test failures detected - deployment blocked!');
    }
    
    return allPassed;
    
  } catch (error) {
    console.error('❌ Critical test execution failed:', error);
    return false;
  }
}

// Export test runner and types for advanced usage
export { TestRunner } from './test-runner';
export * from './types';

// Export individual test suites
export {
  createFormTestingSuite,
  createAPITestingSuite,
  createRealtimeTestingSuite,
  createEdgeCaseTestingSuite,
  createPerformanceTestingSuite,
  createProductionReadinessSuite
};