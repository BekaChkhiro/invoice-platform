import { TestResult, TestSuite, PerformanceMetrics } from './types';

export class PerformanceTestingUtils {
  private baseUrl: string;
  private apiUrl: string;

  constructor(baseUrl = 'http://localhost:3000', apiUrl = '/api') {
    this.baseUrl = baseUrl;
    this.apiUrl = apiUrl;
  }

  async measurePageLoadTimes(): Promise<TestResult> {
    const startTime = Date.now();

    try {
      const pages = [
        { name: 'Dashboard', path: '/dashboard' },
        { name: 'Invoices List', path: '/dashboard/invoices' },
        { name: 'New Invoice', path: '/dashboard/invoices/new' },
        { name: 'Clients List', path: '/dashboard/clients' },
        { name: 'New Client', path: '/dashboard/clients/new' },
        { name: 'Settings', path: '/dashboard/settings' },
        { name: 'Profile', path: '/dashboard/settings/profile' },
        { name: 'Login', path: '/login' }
      ];

      const thresholds = {
        excellent: 1000,  // Under 1s
        good: 2000,      // Under 2s  
        acceptable: 3000, // Under 3s
        poor: 5000       // Under 5s
      };

      const results: Array<{
        page: string;
        loadTime: number;
        rating: string;
        success: boolean;
      }> = [];

      for (const page of pages) {
        try {
          const pageStartTime = Date.now();
          
          const response = await fetch(`${this.baseUrl}${page.path}`, {
            method: 'GET',
            headers: {
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Cache-Control': 'no-cache'
            }
          });

          const loadTime = Date.now() - pageStartTime;
          
          let rating = 'poor';
          if (loadTime < thresholds.excellent) rating = 'excellent';
          else if (loadTime < thresholds.good) rating = 'good';
          else if (loadTime < thresholds.acceptable) rating = 'acceptable';
          
          results.push({
            page: page.name,
            loadTime,
            rating,
            success: response.ok && loadTime < thresholds.poor
          });

        } catch (error) {
          results.push({
            page: page.name,
            loadTime: -1,
            rating: 'error',
            success: false
          });
        }
      }

      const successful = results.filter(r => r.success).length;
      const avgLoadTime = results
        .filter(r => r.loadTime > 0)
        .reduce((sum, r) => sum + r.loadTime, 0) / results.filter(r => r.loadTime > 0).length;

      const excellentPages = results.filter(r => r.rating === 'excellent').length;
      const goodPages = results.filter(r => r.rating === 'good').length;

      return {
        success: successful >= pages.length * 0.8, // 80% of pages should load successfully
        message: `Page load performance: ${successful}/${pages.length} pages loaded, avg ${Math.round(avgLoadTime)}ms (${excellentPages} excellent, ${goodPages} good)`,
        duration: Date.now() - startTime,
        data: {
          results,
          averageLoadTime: avgLoadTime,
          successRate: (successful / pages.length) * 100,
          performanceBreakdown: {
            excellent: excellentPages,
            good: goodPages,
            acceptable: results.filter(r => r.rating === 'acceptable').length,
            poor: results.filter(r => r.rating === 'poor').length
          }
        }
      };

    } catch (error) {
      return {
        success: false,
        message: `Page load time measurement failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  async measureAPIResponseTimes(): Promise<TestResult> {
    const startTime = Date.now();

    try {
      const endpoints = [
        { name: 'List Invoices', method: 'GET', path: '/invoices', threshold: 500 },
        { name: 'List Clients', method: 'GET', path: '/clients', threshold: 500 },
        { name: 'User Credits', method: 'GET', path: '/user/credits', threshold: 200 },
        { name: 'Search Clients', method: 'GET', path: '/clients/search?q=test', threshold: 1000 },
        { name: 'Create Invoice', method: 'POST', path: '/invoices', threshold: 1000, body: this.getMockInvoiceData() },
        { name: 'Create Client', method: 'POST', path: '/clients', threshold: 800, body: this.getMockClientData() }
      ];

      const results: Array<{
        endpoint: string;
        responseTime: number;
        success: boolean;
        withinThreshold: boolean;
        status: number;
      }> = [];

      for (const endpoint of endpoints) {
        try {
          const apiStartTime = Date.now();
          
          const response = await fetch(`${this.baseUrl}${this.apiUrl}${endpoint.path}`, {
            method: endpoint.method,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache'
            },
            body: endpoint.body ? JSON.stringify(endpoint.body) : undefined
          });

          const responseTime = Date.now() - apiStartTime;
          const withinThreshold = responseTime < endpoint.threshold;

          results.push({
            endpoint: `${endpoint.method} ${endpoint.name}`,
            responseTime,
            success: response.ok,
            withinThreshold,
            status: response.status
          });

          // Clean up created resources
          if (endpoint.method === 'POST' && response.ok) {
            try {
              const responseData = await response.json();
              if (responseData.id) {
                const deleteEndpoint = endpoint.path === '/invoices' ? '/invoices' : '/clients';
                await fetch(`${this.baseUrl}${this.apiUrl}${deleteEndpoint}/${responseData.id}`, {
                  method: 'DELETE'
                });
              }
            } catch (cleanupError) {
              // Ignore cleanup errors
            }
          }

        } catch (error) {
          results.push({
            endpoint: `${endpoint.method} ${endpoint.name}`,
            responseTime: -1,
            success: false,
            withinThreshold: false,
            status: -1
          });
        }
      }

      const successful = results.filter(r => r.success).length;
      const withinThreshold = results.filter(r => r.withinThreshold).length;
      const avgResponseTime = results
        .filter(r => r.responseTime > 0)
        .reduce((sum, r) => sum + r.responseTime, 0) / results.filter(r => r.responseTime > 0).length;

      return {
        success: successful >= endpoints.length * 0.8 && withinThreshold >= endpoints.length * 0.7,
        message: `API performance: ${successful}/${endpoints.length} success, ${withinThreshold} within threshold, avg ${Math.round(avgResponseTime)}ms`,
        duration: Date.now() - startTime,
        data: {
          results,
          averageResponseTime: avgResponseTime,
          successRate: (successful / endpoints.length) * 100,
          thresholdRate: (withinThreshold / endpoints.length) * 100
        }
      };

    } catch (error) {
      return {
        success: false,
        message: `API response time measurement failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  async measurePDFGenerationTime(): Promise<TestResult> {
    const startTime = Date.now();

    try {
      // First create a test invoice
      const invoiceResponse = await fetch(`${this.baseUrl}${this.apiUrl}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.getMockInvoiceData())
      });

      if (!invoiceResponse.ok) {
        throw new Error('Failed to create test invoice for PDF generation');
      }

      const invoice = await invoiceResponse.json();
      const invoiceId = invoice.id;

      // Test PDF generation with different complexity levels
      const pdfTests = [
        { name: 'Simple Invoice', items: 1, expectedTime: 3000 },
        { name: 'Medium Invoice', items: 5, expectedTime: 5000 },
        { name: 'Complex Invoice', items: 20, expectedTime: 8000 }
      ];

      const results: Array<{
        test: string;
        generationTime: number;
        success: boolean;
        withinExpected: boolean;
        fileSize: number;
      }> = [];

      for (const test of pdfTests) {
        try {
          // Update invoice with different complexity
          await fetch(`${this.baseUrl}${this.apiUrl}/invoices/${invoiceId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items: Array.from({ length: test.items }, (_, i) => ({
                description: `Test Item ${i + 1}`,
                quantity: 1,
                unitPrice: 100
              }))
            })
          });

          const pdfStartTime = Date.now();
          
          const pdfResponse = await fetch(`${this.baseUrl}${this.apiUrl}/invoices/${invoiceId}/pdf`);
          
          const generationTime = Date.now() - pdfStartTime;
          const withinExpected = generationTime < test.expectedTime;

          let fileSize = 0;
          if (pdfResponse.ok) {
            const blob = await pdfResponse.blob();
            fileSize = blob.size;
          }

          results.push({
            test: test.name,
            generationTime,
            success: pdfResponse.ok && fileSize > 0,
            withinExpected,
            fileSize
          });

        } catch (error) {
          results.push({
            test: test.name,
            generationTime: -1,
            success: false,
            withinExpected: false,
            fileSize: 0
          });
        }
      }

      // Cleanup
      await fetch(`${this.baseUrl}${this.apiUrl}/invoices/${invoiceId}`, {
        method: 'DELETE'
      });

      const successful = results.filter(r => r.success).length;
      const withinExpected = results.filter(r => r.withinExpected).length;
      const avgGenerationTime = results
        .filter(r => r.generationTime > 0)
        .reduce((sum, r) => sum + r.generationTime, 0) / results.filter(r => r.generationTime > 0).length;

      return {
        success: successful >= pdfTests.length * 0.8,
        message: `PDF generation: ${successful}/${pdfTests.length} success, ${withinExpected} within expected time, avg ${Math.round(avgGenerationTime)}ms`,
        duration: Date.now() - startTime,
        data: {
          results,
          averageGenerationTime: avgGenerationTime,
          successRate: (successful / pdfTests.length) * 100
        }
      };

    } catch (error) {
      return {
        success: false,
        message: `PDF generation time measurement failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  async measureSearchPerformance(): Promise<TestResult> {
    const startTime = Date.now();

    try {
      const searchScenarios = [
        { name: 'Client Name Search', endpoint: '/clients/search', query: 'test', threshold: 200 },
        { name: 'Client Email Search', endpoint: '/clients/search', query: '@example.com', threshold: 300 },
        { name: 'Georgian Text Search', endpoint: '/clients/search', query: 'ტესტი', threshold: 400 },
        { name: 'Partial Match Search', endpoint: '/clients/search', query: 'tes', threshold: 500 },
        { name: 'Empty Search', endpoint: '/clients/search', query: '', threshold: 100 },
        { name: 'Special Characters', endpoint: '/clients/search', query: '!@#$%', threshold: 200 }
      ];

      const results: Array<{
        scenario: string;
        searchTime: number;
        success: boolean;
        withinThreshold: boolean;
        resultCount: number;
      }> = [];

      for (const scenario of searchScenarios) {
        try {
          const searchStartTime = Date.now();
          
          const response = await fetch(`${this.baseUrl}${this.apiUrl}${scenario.endpoint}?q=${encodeURIComponent(scenario.query)}`, {
            method: 'GET',
            headers: {
              'Cache-Control': 'no-cache'
            }
          });

          const searchTime = Date.now() - searchStartTime;
          const withinThreshold = searchTime < scenario.threshold;

          let resultCount = 0;
          if (response.ok) {
            try {
              const searchResults = await response.json();
              resultCount = Array.isArray(searchResults) ? searchResults.length : 0;
            } catch (parseError) {
              // If can't parse results, still consider successful if response was ok
            }
          }

          results.push({
            scenario: scenario.name,
            searchTime,
            success: response.ok,
            withinThreshold,
            resultCount
          });

        } catch (error) {
          results.push({
            scenario: scenario.name,
            searchTime: -1,
            success: false,
            withinThreshold: false,
            resultCount: 0
          });
        }
      }

      const successful = results.filter(r => r.success).length;
      const withinThreshold = results.filter(r => r.withinThreshold).length;
      const avgSearchTime = results
        .filter(r => r.searchTime > 0)
        .reduce((sum, r) => sum + r.searchTime, 0) / results.filter(r => r.searchTime > 0).length;

      return {
        success: successful >= searchScenarios.length * 0.8,
        message: `Search performance: ${successful}/${searchScenarios.length} success, ${withinThreshold} within threshold, avg ${Math.round(avgSearchTime)}ms`,
        duration: Date.now() - startTime,
        data: {
          results,
          averageSearchTime: avgSearchTime,
          successRate: (successful / searchScenarios.length) * 100,
          thresholdRate: (withinThreshold / searchScenarios.length) * 100
        }
      };

    } catch (error) {
      return {
        success: false,
        message: `Search performance measurement failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  async monitorMemoryUsage(): Promise<TestResult> {
    const startTime = Date.now();

    try {
      // Check if performance memory API is available
      if (!('memory' in performance)) {
        return {
          success: true,
          message: 'Memory monitoring not available in this environment',
          duration: Date.now() - startTime,
          data: { available: false }
        };
      }

      const memory = (performance as any).memory;
      const initialMemory = {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit
      };

      // Perform memory-intensive operations
      const memoryTests = [
        {
          name: 'Large Data Processing',
          operation: async () => {
            // Simulate processing large dataset
            const largeArray = new Array(10000).fill(0).map((_, i) => ({
              id: i,
              name: `Item ${i}`,
              data: new Array(100).fill(`data-${i}`)
            }));
            
            // Process the array
            const processed = largeArray.map(item => ({
              ...item,
              processed: true,
              timestamp: Date.now()
            }));
            
            return processed.length;
          }
        },
        {
          name: 'DOM Manipulation',
          operation: async () => {
            if (typeof document === 'undefined') return 0;
            
            // Create and remove many DOM elements
            const container = document.createElement('div');
            document.body.appendChild(container);
            
            for (let i = 0; i < 1000; i++) {
              const element = document.createElement('div');
              element.textContent = `Test element ${i}`;
              container.appendChild(element);
            }
            
            const count = container.children.length;
            document.body.removeChild(container);
            
            return count;
          }
        },
        {
          name: 'String Manipulation',
          operation: async () => {
            let longString = '';
            for (let i = 0; i < 10000; i++) {
              longString += `This is test string number ${i} with some additional content to make it longer. `;
            }
            
            const processed = longString
              .split(' ')
              .filter(word => word.length > 3)
              .map(word => word.toUpperCase())
              .join(' ');
            
            return processed.length;
          }
        }
      ];

      const memoryResults = [];

      for (const test of memoryTests) {
        const beforeMemory = memory.usedJSHeapSize;
        const beforeTime = Date.now();
        
        try {
          await test.operation();
          
          const afterTime = Date.now();
          const afterMemory = memory.usedJSHeapSize;
          const memoryDelta = afterMemory - beforeMemory;
          const timeDelta = afterTime - beforeTime;
          
          // Force garbage collection if available
          if ((window as any).gc) {
            (window as any).gc();
          }
          
          const afterGCMemory = memory.usedJSHeapSize;
          const memoryLeakage = afterGCMemory - beforeMemory;
          
          memoryResults.push({
            test: test.name,
            memoryDelta: memoryDelta / 1024 / 1024, // MB
            memoryLeakage: memoryLeakage / 1024 / 1024, // MB
            executionTime: timeDelta,
            hasMemoryLeak: memoryLeakage > 1024 * 1024 // > 1MB leak
          });
          
        } catch (error) {
          memoryResults.push({
            test: test.name,
            memoryDelta: -1,
            memoryLeakage: -1,
            executionTime: -1,
            hasMemoryLeak: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      const finalMemory = {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit
      };

      const totalMemoryIncrease = (finalMemory.used - initialMemory.used) / 1024 / 1024; // MB
      const hasSignificantLeaks = memoryResults.some(r => r.hasMemoryLeak);
      const memoryEfficient = totalMemoryIncrease < 50; // Under 50MB increase

      return {
        success: !hasSignificantLeaks && memoryEfficient,
        message: `Memory usage: ${totalMemoryIncrease.toFixed(2)}MB increase, ${hasSignificantLeaks ? 'leaks detected' : 'no major leaks'}`,
        duration: Date.now() - startTime,
        data: {
          initialMemory,
          finalMemory,
          totalIncrease: totalMemoryIncrease,
          testResults: memoryResults,
          hasLeaks: hasSignificantLeaks,
          efficient: memoryEfficient
        }
      };

    } catch (error) {
      return {
        success: false,
        message: `Memory usage monitoring failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  async runComprehensivePerformanceTest(): Promise<TestResult> {
    const startTime = Date.now();

    try {
      const performanceTests = [
        { name: 'Page Load Times', test: () => this.measurePageLoadTimes() },
        { name: 'API Response Times', test: () => this.measureAPIResponseTimes() },
        { name: 'PDF Generation', test: () => this.measurePDFGenerationTime() },
        { name: 'Search Performance', test: () => this.measureSearchPerformance() },
        { name: 'Memory Usage', test: () => this.monitorMemoryUsage() }
      ];

      const results: Array<{
        category: string;
        success: boolean;
        message: string;
        duration: number;
        data?: any;
      }> = [];

      for (const test of performanceTests) {
        try {
          const result = await test.test();
          results.push({
            category: test.name,
            success: result.success,
            message: result.message,
            duration: result.duration,
            data: result.data
          });
        } catch (error) {
          results.push({
            category: test.name,
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
            duration: -1
          });
        }
      }

      const successfulTests = results.filter(r => r.success).length;
      const overallSuccess = successfulTests >= performanceTests.length * 0.8;
      const totalTestTime = results.reduce((sum, r) => sum + Math.max(0, r.duration), 0);

      // Extract key metrics
      const metrics: PerformanceMetrics = {
        pageLoadTime: this.extractMetric(results, 'Page Load Times', 'averageLoadTime') || -1,
        apiResponseTime: this.extractMetric(results, 'API Response Times', 'averageResponseTime') || -1,
        pdfGenerationTime: this.extractMetric(results, 'PDF Generation', 'averageGenerationTime') || -1,
        searchTime: this.extractMetric(results, 'Search Performance', 'averageSearchTime') || -1,
        memoryUsage: this.extractMetric(results, 'Memory Usage', 'totalIncrease') || -1
      };

      return {
        success: overallSuccess,
        message: `Performance overview: ${successfulTests}/${performanceTests.length} categories passed, total test time ${Math.round(totalTestTime)}ms`,
        duration: Date.now() - startTime,
        data: {
          categoryResults: results,
          metrics,
          overallPerformance: {
            successRate: (successfulTests / performanceTests.length) * 100,
            totalTestDuration: totalTestTime
          }
        }
      };

    } catch (error) {
      return {
        success: false,
        message: `Comprehensive performance test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  private extractMetric(results: any[], category: string, metricName: string): number | undefined {
    const categoryResult = results.find(r => r.category === category);
    return categoryResult?.data?.[metricName];
  }

  private getMockInvoiceData() {
    return {
      clientId: 'perf-test-client',
      invoiceNumber: `PERF-${Date.now()}`,
      issueDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      items: [
        {
          description: 'Performance Test Service',
          quantity: 1,
          unitPrice: 100,
          total: 100
        }
      ],
      subtotal: 100,
      vatRate: 18,
      vatAmount: 18,
      total: 118
    };
  }

  private getMockClientData() {
    return {
      name: `Performance Test Client ${Date.now()}`,
      email: `perf-test-${Date.now()}@example.com`,
      phone: '+995555123456',
      address: 'Performance Test Address, Tbilisi, Georgia'
    };
  }
}

export function createPerformanceTestingSuite(): TestSuite {
  const performanceTesting = new PerformanceTestingUtils();

  return {
    name: 'Performance Testing',
    tests: [
      {
        name: 'Page Load Performance',
        fn: () => performanceTesting.measurePageLoadTimes(),
        timeout: 30000
      },
      {
        name: 'API Response Performance',
        fn: () => performanceTesting.measureAPIResponseTimes(),
        timeout: 20000
      },
      {
        name: 'PDF Generation Performance',
        fn: () => performanceTesting.measurePDFGenerationTime(),
        timeout: 30000
      },
      {
        name: 'Search Performance',
        fn: () => performanceTesting.measureSearchPerformance(),
        timeout: 15000
      },
      {
        name: 'Memory Usage Monitoring',
        fn: () => performanceTesting.monitorMemoryUsage(),
        timeout: 20000
      },
      {
        name: 'Comprehensive Performance Test',
        fn: () => performanceTesting.runComprehensivePerformanceTest(),
        timeout: 120000
      }
    ]
  };
}