import { TestSuite, TestCase, TestResult, TestConfig } from './types';

export class TestRunner {
  private config: TestConfig;
  private results: Map<string, TestResult[]> = new Map();

  constructor(config: Partial<TestConfig> = {}) {
    this.config = {
      baseUrl: 'http://localhost:3000',
      apiUrl: '/api',
      timeout: 30000,
      retries: 3,
      parallel: true,
      headless: true,
      viewport: { width: 1280, height: 720 },
      ...config
    };
  }

  async runSuite(suite: TestSuite): Promise<TestResult[]> {
    console.log(`🧪 Running test suite: ${suite.name}`);
    
    try {
      if (suite.setup) {
        await suite.setup();
      }

      const results: TestResult[] = [];
      
      if (this.config.parallel) {
        const promises = suite.tests
          .filter(test => !test.skip)
          .map(test => this.runTest(test));
        results.push(...await Promise.all(promises));
      } else {
        for (const test of suite.tests) {
          if (!test.skip) {
            results.push(await this.runTest(test));
          }
        }
      }

      this.results.set(suite.name, results);
      
      if (suite.teardown) {
        await suite.teardown();
      }

      this.logSuiteResults(suite.name, results);
      return results;

    } catch (error) {
      console.error(`❌ Suite ${suite.name} failed:`, error);
      throw error;
    }
  }

  private async runTest(test: TestCase): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      console.log(`  🔍 Running: ${test.name}`);
      
      const timeoutPromise = new Promise<TestResult>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Test timeout: ${test.name}`));
        }, test.timeout || this.config.timeout);
      });

      const testPromise = this.executeWithRetry(test.fn);
      const result = await Promise.race([testPromise, timeoutPromise]);
      
      result.duration = Date.now() - startTime;
      
      if (result.success) {
        console.log(`  ✅ ${test.name} (${result.duration}ms)`);
      } else {
        console.log(`  ❌ ${test.name}: ${result.message} (${result.duration}ms)`);
      }

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`  ❌ ${test.name}: ${error instanceof Error ? error.message : 'Unknown error'} (${duration}ms)`);
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        duration,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  private async executeWithRetry(testFn: () => Promise<TestResult>): Promise<TestResult> {
    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= this.config.retries; attempt++) {
      try {
        return await testFn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < this.config.retries) {
          console.log(`    🔄 Retry ${attempt}/${this.config.retries}`);
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    throw lastError;
  }

  private logSuiteResults(suiteName: string, results: TestResult[]): void {
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`\n📊 Suite "${suiteName}" Results:`);
    console.log(`  ✅ Passed: ${passed}`);
    console.log(`  ❌ Failed: ${failed}`);
    console.log(`  ⏱️  Total time: ${totalDuration}ms`);
    console.log(`  📈 Success rate: ${((passed / results.length) * 100).toFixed(1)}%\n`);
  }

  async runAllSuites(suites: TestSuite[]): Promise<Map<string, TestResult[]>> {
    console.log(`🚀 Starting test run with ${suites.length} suites\n`);
    
    const startTime = Date.now();
    
    for (const suite of suites) {
      await this.runSuite(suite);
    }

    const totalDuration = Date.now() - startTime;
    this.logFinalResults(totalDuration);
    
    return this.results;
  }

  private logFinalResults(totalDuration: number): void {
    let totalPassed = 0;
    let totalFailed = 0;
    let totalTests = 0;

    for (const [suiteName, results] of this.results) {
      const passed = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      totalPassed += passed;
      totalFailed += failed;
      totalTests += results.length;
    }

    console.log(`\n🎯 FINAL RESULTS:`);
    console.log(`  📝 Total tests: ${totalTests}`);
    console.log(`  ✅ Passed: ${totalPassed}`);
    console.log(`  ❌ Failed: ${totalFailed}`);
    console.log(`  ⏱️  Total time: ${totalDuration}ms`);
    console.log(`  📈 Overall success rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%`);
    
    if (totalFailed > 0) {
      console.log(`\n🔍 Failed Tests:`);
      for (const [suiteName, results] of this.results) {
        const failed = results.filter(r => !r.success);
        if (failed.length > 0) {
          console.log(`  Suite: ${suiteName}`);
          failed.forEach(result => {
            console.log(`    ❌ ${result.message}`);
          });
        }
      }
    }
  }

  getResults(): Map<string, TestResult[]> {
    return this.results;
  }

  exportResults(format: 'json' | 'html' = 'json'): string {
    const data = Object.fromEntries(this.results);
    
    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }
    
    // HTML export
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Test Results</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .suite { margin: 20px 0; border: 1px solid #ddd; padding: 15px; }
          .passed { color: green; }
          .failed { color: red; }
          .summary { background: #f5f5f5; padding: 10px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <h1>Test Results</h1>
    `;
    
    for (const [suiteName, results] of this.results) {
      const passed = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      html += `
        <div class="suite">
          <h2>${suiteName}</h2>
          <div class="summary">
            <strong>Passed:</strong> ${passed} | <strong>Failed:</strong> ${failed}
          </div>
          <ul>
      `;
      
      results.forEach(result => {
        const status = result.success ? 'passed' : 'failed';
        html += `<li class="${status}">${result.message} (${result.duration}ms)</li>`;
      });
      
      html += `</ul></div>`;
    }
    
    html += `</body></html>`;
    return html;
  }
}