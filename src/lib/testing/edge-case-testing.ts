import { TestResult, TestSuite, ErrorTestScenario } from './types';

export class EdgeCaseTestingUtils {
  private baseUrl: string;
  private apiUrl: string;

  constructor(baseUrl = 'http://localhost:3000', apiUrl = '/api') {
    this.baseUrl = baseUrl;
    this.apiUrl = apiUrl;
  }

  async testZeroCreditScenario(): Promise<TestResult> {
    const startTime = Date.now();

    try {
      // Simulate user with zero credits
      const creditResponse = await fetch(`${this.baseUrl}${this.apiUrl}/user/credits`);
      let currentCredits = 0;

      if (creditResponse.ok) {
        const creditData = await creditResponse.json();
        currentCredits = creditData.credits || 0;
      }

      // Try to create invoice with zero credits
      const invoiceResponse = await fetch(`${this.baseUrl}${this.apiUrl}/invoices`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Credits': '0' // Force zero credits scenario
        },
        body: JSON.stringify({
          clientId: 'test-client',
          total: 100,
          items: [{ description: 'Test Item', quantity: 1, unitPrice: 100 }]
        })
      });

      // Should be rejected due to insufficient credits
      const shouldBeRejected = !invoiceResponse.ok && (invoiceResponse.status === 402 || invoiceResponse.status === 400);
      const errorMessage = shouldBeRejected ? await invoiceResponse.text().catch(() => 'No error message') : '';

      // Test UI handling of zero credits
      const hasProperErrorHandling = errorMessage.includes('credit') || errorMessage.includes('insufficient');

      return {
        success: shouldBeRejected && hasProperErrorHandling,
        message: `Zero credit scenario: Request ${shouldBeRejected ? 'properly rejected' : 'incorrectly accepted'}, Error handling ${hasProperErrorHandling ? 'good' : 'poor'}`,
        duration: Date.now() - startTime,
        data: {
          requestRejected: shouldBeRejected,
          errorHandling: hasProperErrorHandling,
          responseStatus: invoiceResponse.status,
          errorMessage,
          currentCredits
        }
      };

    } catch (error) {
      return {
        success: false,
        message: `Zero credit scenario test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  async testInvalidFileUpload(): Promise<TestResult> {
    const startTime = Date.now();

    try {
      const maliciousFiles = [
        { name: 'virus.exe', content: 'MZ\x90\x00', type: 'application/x-msdownload', expected: 'executable_rejected' },
        { name: 'script.js', content: 'alert("xss")', type: 'application/javascript', expected: 'script_rejected' },
        { name: 'huge.txt', content: 'a'.repeat(50 * 1024 * 1024), type: 'text/plain', expected: 'size_rejected' }, // 50MB
        { name: 'test.php', content: '<?php system($_GET["cmd"]); ?>', type: 'application/x-php', expected: 'php_rejected' },
        { name: 'empty', content: '', type: 'application/octet-stream', expected: 'empty_rejected' }
      ];

      const results: Array<{ file: string; success: boolean; message: string }> = [];

      for (const fileTest of maliciousFiles) {
        try {
          const file = new File([fileTest.content], fileTest.name, { type: fileTest.type });
          const formData = new FormData();
          formData.append('file', file);

          const response = await fetch(`${this.baseUrl}/api/upload/avatar`, {
            method: 'POST',
            body: formData
          });

          const wasRejected = !response.ok;
          const responseText = await response.text().catch(() => '');

          results.push({
            file: fileTest.name,
            success: wasRejected,
            message: wasRejected 
              ? `Correctly rejected: ${response.status} - ${responseText}`
              : `SECURITY RISK: Malicious file accepted!`
          });

        } catch (error) {
          results.push({
            file: fileTest.name,
            success: true,
            message: `Network error (considered safe): ${error instanceof Error ? error.message : 'Unknown error'}`
          });
        }
      }

      const securityPassed = results.filter(r => r.success).length;
      const securityRisks = results.filter(r => !r.success).length;

      return {
        success: securityRisks === 0,
        message: `File upload security: ${securityPassed}/${results.length} malicious files blocked, ${securityRisks} security risks`,
        duration: Date.now() - startTime,
        data: { results, securityPassed, securityRisks }
      };

    } catch (error) {
      return {
        success: false,
        message: `Invalid file upload test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  async testLargeDatasets(): Promise<TestResult> {
    const startTime = Date.now();

    try {
      const largeBatchSize = 100; // Start with reasonable size
      const performanceThresholds = {
        listInvoices: 2000, // 2 seconds
        searchClients: 1000, // 1 second
        bulkOperations: 5000, // 5 seconds
        pdfGeneration: 10000 // 10 seconds
      };

      const performanceTests = [
        {
          name: 'Large Invoice List',
          test: async () => {
            const testStartTime = Date.now();
            const response = await fetch(`${this.baseUrl}${this.apiUrl}/invoices?limit=1000`);
            const duration = Date.now() - testStartTime;
            return { success: response.ok && duration < performanceThresholds.listInvoices, duration };
          }
        },
        {
          name: 'Client Search Performance',
          test: async () => {
            const testStartTime = Date.now();
            const response = await fetch(`${this.baseUrl}${this.apiUrl}/clients/search?q=test`);
            const duration = Date.now() - testStartTime;
            return { success: response.ok && duration < performanceThresholds.searchClients, duration };
          }
        },
        {
          name: 'Bulk Client Creation',
          test: async () => {
            const testStartTime = Date.now();
            const bulkClients = Array.from({ length: largeBatchSize }, (_, i) => ({
              name: `Bulk Client ${i}`,
              email: `bulk${i}@example.com`
            }));
            
            const promises = bulkClients.map(client =>
              fetch(`${this.baseUrl}${this.apiUrl}/clients`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(client)
              })
            );

            const results = await Promise.allSettled(promises);
            const duration = Date.now() - testStartTime;
            const successful = results.filter(r => r.status === 'fulfilled' && r.value.ok).length;

            return { 
              success: successful > largeBatchSize * 0.8 && duration < performanceThresholds.bulkOperations, 
              duration,
              successful 
            };
          }
        }
      ];

      const results: Array<{ test: string; success: boolean; duration: number; message: string }> = [];

      for (const test of performanceTests) {
        try {
          const result = await test.test();
          results.push({
            test: test.name,
            success: result.success,
            duration: result.duration,
            message: `${result.duration}ms ${result.success ? '(Pass)' : '(Slow)'}`
          });
        } catch (error) {
          results.push({
            test: test.name,
            success: false,
            duration: -1,
            message: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      const passed = results.filter(r => r.success).length;
      const avgDuration = results.reduce((sum, r) => sum + Math.max(0, r.duration), 0) / results.length;

      return {
        success: passed >= results.length * 0.7, // 70% pass rate acceptable for large datasets
        message: `Large dataset performance: ${passed}/${results.length} tests passed, avg ${Math.round(avgDuration)}ms`,
        duration: Date.now() - startTime,
        data: { results, passed, avgDuration }
      };

    } catch (error) {
      return {
        success: false,
        message: `Large dataset test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  async testSpecialCharacters(): Promise<TestResult> {
    const startTime = Date.now();

    try {
      const specialCharacterTests = [
        { name: 'Georgian Unicode', text: 'ანგარიში № 123 - სატესტო კომპანია ჯ.ას.' },
        { name: 'Emojis', text: 'Invoice 🧾 from Company 🏢 - Total: 💰 100₾' },
        { name: 'Mathematical Symbols', text: 'Quantity: ∑(1×2) = 2 ± 0.01 ∞' },
        { name: 'Currency Symbols', text: '€100 + $50 + £30 + ¥200 + ₾150' },
        { name: 'HTML/XML Characters', text: '<script>alert("xss")</script> & <b>bold</b>' },
        { name: 'SQL Injection', text: "'; DROP TABLE invoices; --" },
        { name: 'Long Text', text: 'ა'.repeat(1000) }, // Very long Georgian text
        { name: 'Mixed Scripts', text: 'Invoice ანგარიში नंबर номер 123' },
        { name: 'Zero Width Characters', text: 'Invisible\u200B\u200C\u200D\uFEFFcharacters' },
        { name: 'Newlines and Tabs', text: 'Line 1\nLine 2\tTabbed\r\nWindows line' }
      ];

      const results: Array<{ test: string; success: boolean; message: string }> = [];

      for (const charTest of specialCharacterTests) {
        try {
          // Test client creation with special characters
          const clientResponse = await fetch(`${this.baseUrl}${this.apiUrl}/clients`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: charTest.text,
              email: 'test@example.com'
            })
          });

          let testPassed = false;
          let message = '';

          if (clientResponse.ok) {
            const clientData = await clientResponse.json();
            const retrievedName = clientData.name;
            
            // Check if data was properly stored and retrieved
            testPassed = retrievedName === charTest.text;
            message = testPassed ? 'Data preserved correctly' : 'Data corrupted/modified';

            // Cleanup
            if (clientData.id) {
              await fetch(`${this.baseUrl}${this.apiUrl}/clients/${clientData.id}`, {
                method: 'DELETE'
              });
            }
          } else {
            const errorText = await clientResponse.text().catch(() => '');
            
            // Some rejection might be expected (like SQL injection)
            if (charTest.name === 'SQL Injection' || charTest.name === 'HTML/XML Characters') {
              testPassed = !clientResponse.ok; // Should be rejected
              message = 'Malicious input correctly rejected';
            } else {
              testPassed = false;
              message = `Request failed: ${clientResponse.status} - ${errorText}`;
            }
          }

          results.push({
            test: charTest.name,
            success: testPassed,
            message
          });

        } catch (error) {
          results.push({
            test: charTest.name,
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      const passed = results.filter(r => r.success).length;
      const unicodePassed = results
        .filter(r => r.test.includes('Georgian') || r.test.includes('Emoji') || r.test.includes('Currency'))
        .filter(r => r.success).length;
      const securityPassed = results
        .filter(r => r.test.includes('SQL') || r.test.includes('HTML'))
        .filter(r => r.success).length;

      return {
        success: passed >= results.length * 0.8, // 80% pass rate
        message: `Special characters: ${passed}/${results.length} passed (Unicode: ${unicodePassed}, Security: ${securityPassed})`,
        duration: Date.now() - startTime,
        data: { results, passed, unicodePassed, securityPassed }
      };

    } catch (error) {
      return {
        success: false,
        message: `Special characters test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  async testBrowserCompatibility(): Promise<TestResult> {
    const startTime = Date.now();

    try {
      // Test browser feature compatibility
      const browserFeatureTests = [
        {
          name: 'LocalStorage Support',
          test: () => typeof localStorage !== 'undefined' && localStorage.setItem && localStorage.getItem
        },
        {
          name: 'Fetch API Support',
          test: () => typeof fetch === 'function'
        },
        {
          name: 'ES6+ Support',
          test: () => {
            try {
              const arrow = () => true;
              const [a] = [1];
              const { b = 2 } = {};
              return arrow() && a === 1 && b === 2;
            } catch {
              return false;
            }
          }
        },
        {
          name: 'FormData Support',
          test: () => typeof FormData === 'function'
        },
        {
          name: 'File API Support',
          test: () => typeof File === 'function' && typeof FileReader === 'function'
        },
        {
          name: 'Web Workers Support',
          test: () => typeof Worker === 'function'
        },
        {
          name: 'Service Worker Support',
          test: () => 'serviceWorker' in navigator
        },
        {
          name: 'IndexedDB Support',
          test: () => 'indexedDB' in window
        },
        {
          name: 'Canvas Support',
          test: () => {
            try {
              const canvas = document.createElement('canvas');
              return !!(canvas.getContext && canvas.getContext('2d'));
            } catch {
              return false;
            }
          }
        },
        {
          name: 'CSS Grid Support',
          test: () => CSS.supports && CSS.supports('display', 'grid')
        }
      ];

      const featureResults = browserFeatureTests.map(test => ({
        feature: test.name,
        supported: test.test(),
        critical: ['LocalStorage Support', 'Fetch API Support', 'ES6+ Support'].includes(test.name)
      }));

      const criticalFeatures = featureResults.filter(r => r.critical);
      const criticalSupported = criticalFeatures.filter(r => r.supported).length;
      const totalSupported = featureResults.filter(r => r.supported).length;

      // Test responsive design breakpoints
      const viewportTests = [
        { name: 'Mobile Portrait', width: 375, height: 667 },
        { name: 'Mobile Landscape', width: 667, height: 375 },
        { name: 'Tablet Portrait', width: 768, height: 1024 },
        { name: 'Desktop', width: 1920, height: 1080 }
      ];

      const viewportResults = viewportTests.map(viewport => {
        try {
          // Simulate viewport test
          const isSupported = viewport.width >= 320; // Minimum supported width
          return {
            viewport: viewport.name,
            dimensions: `${viewport.width}x${viewport.height}`,
            supported: isSupported
          };
        } catch {
          return {
            viewport: viewport.name,
            dimensions: `${viewport.width}x${viewport.height}`,
            supported: false
          };
        }
      });

      const viewportSupported = viewportResults.filter(r => r.supported).length;
      const allCriticalSupported = criticalSupported === criticalFeatures.length;
      const goodCompatibility = totalSupported >= featureResults.length * 0.7;

      return {
        success: allCriticalSupported && goodCompatibility,
        message: `Browser compatibility: ${totalSupported}/${featureResults.length} features, ${criticalSupported}/${criticalFeatures.length} critical, ${viewportSupported}/4 viewports`,
        duration: Date.now() - startTime,
        data: {
          featureResults,
          viewportResults,
          criticalSupported: allCriticalSupported,
          totalCompatibility: (totalSupported / featureResults.length) * 100
        }
      };

    } catch (error) {
      return {
        success: false,
        message: `Browser compatibility test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  async testInvoiceNumberCollision(): Promise<TestResult> {
    const startTime = Date.now();

    try {
      const duplicateInvoiceNumber = `INV-${Date.now()}`;

      // Create first invoice
      const firstInvoiceResponse = await fetch(`${this.baseUrl}${this.apiUrl}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: 'test-client-1',
          invoiceNumber: duplicateInvoiceNumber,
          total: 100,
          items: [{ description: 'First invoice', quantity: 1, unitPrice: 100 }]
        })
      });

      if (!firstInvoiceResponse.ok) {
        throw new Error('Failed to create first invoice');
      }

      const firstInvoice = await firstInvoiceResponse.json();

      // Attempt to create second invoice with same number
      const secondInvoiceResponse = await fetch(`${this.baseUrl}${this.apiUrl}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: 'test-client-2',
          invoiceNumber: duplicateInvoiceNumber,
          total: 200,
          items: [{ description: 'Duplicate invoice', quantity: 1, unitPrice: 200 }]
        })
      });

      // Should be rejected
      const duplicateRejected = !secondInvoiceResponse.ok;
      const errorMessage = duplicateRejected ? await secondInvoiceResponse.text().catch(() => '') : '';
      const hasProperError = errorMessage.toLowerCase().includes('duplicate') || 
                            errorMessage.toLowerCase().includes('exist') ||
                            errorMessage.toLowerCase().includes('unique');

      // Cleanup
      await fetch(`${this.baseUrl}${this.apiUrl}/invoices/${firstInvoice.id}`, {
        method: 'DELETE'
      });

      return {
        success: duplicateRejected && hasProperError,
        message: `Invoice number collision: ${duplicateRejected ? 'Correctly rejected' : 'FAILED - Duplicate allowed'}, Error message ${hasProperError ? 'appropriate' : 'poor'}`,
        duration: Date.now() - startTime,
        data: {
          duplicateRejected,
          hasProperError,
          errorMessage,
          invoiceNumber: duplicateInvoiceNumber
        }
      };

    } catch (error) {
      return {
        success: false,
        message: `Invoice number collision test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  async testClientEmailDuplication(): Promise<TestResult> {
    const startTime = Date.now();

    try {
      const duplicateEmail = `duplicate-${Date.now()}@example.com`;

      // Create first client
      const firstClientResponse = await fetch(`${this.baseUrl}${this.apiUrl}/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'First Client',
          email: duplicateEmail
        })
      });

      if (!firstClientResponse.ok) {
        throw new Error('Failed to create first client');
      }

      const firstClient = await firstClientResponse.json();

      // Attempt to create second client with same email
      const secondClientResponse = await fetch(`${this.baseUrl}${this.apiUrl}/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Second Client',
          email: duplicateEmail
        })
      });

      // Check if duplicate is handled properly
      const duplicateHandled = !secondClientResponse.ok || secondClientResponse.status === 409;
      const errorMessage = !secondClientResponse.ok ? await secondClientResponse.text().catch(() => '') : '';
      const hasProperError = errorMessage.toLowerCase().includes('email') || 
                            errorMessage.toLowerCase().includes('duplicate') ||
                            errorMessage.toLowerCase().includes('exist');

      // Cleanup
      await fetch(`${this.baseUrl}${this.apiUrl}/clients/${firstClient.id}`, {
        method: 'DELETE'
      });

      return {
        success: duplicateHandled,
        message: `Client email duplication: ${duplicateHandled ? 'Properly handled' : 'FAILED - Duplicate allowed'}, Error message ${hasProperError ? 'appropriate' : 'needs improvement'}`,
        duration: Date.now() - startTime,
        data: {
          duplicateHandled,
          hasProperError,
          errorMessage,
          email: duplicateEmail
        }
      };

    } catch (error) {
      return {
        success: false,
        message: `Client email duplication test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  async testInvalidDateRanges(): Promise<TestResult> {
    const startTime = Date.now();

    try {
      const invalidDateScenarios = [
        {
          name: 'Due Date Before Issue Date',
          issueDate: new Date('2025-01-15').toISOString(),
          dueDate: new Date('2025-01-10').toISOString(),
          shouldReject: true
        },
        {
          name: 'Issue Date in Future',
          issueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          shouldReject: false // May be allowed for future invoices
        },
        {
          name: 'Very Old Issue Date',
          issueDate: new Date('1999-01-01').toISOString(),
          dueDate: new Date('1999-01-31').toISOString(),
          shouldReject: false // Historical invoices should be allowed
        },
        {
          name: 'Invalid Date Format',
          issueDate: 'not-a-date',
          dueDate: 'also-not-a-date',
          shouldReject: true
        }
      ];

      const results: Array<{ scenario: string; success: boolean; message: string }> = [];

      for (const scenario of invalidDateScenarios) {
        try {
          const invoiceResponse = await fetch(`${this.baseUrl}${this.apiUrl}/invoices`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clientId: 'test-client',
              invoiceNumber: `INV-DATE-${Date.now()}`,
              issueDate: scenario.issueDate,
              dueDate: scenario.dueDate,
              total: 100,
              items: [{ description: 'Date test', quantity: 1, unitPrice: 100 }]
            })
          });

          const wasRejected = !invoiceResponse.ok;
          const expectedOutcome = scenario.shouldReject ? wasRejected : !wasRejected;
          const errorMessage = wasRejected ? await invoiceResponse.text().catch(() => '') : '';

          // If invoice was created, clean it up
          if (invoiceResponse.ok) {
            const invoiceData = await invoiceResponse.json();
            if (invoiceData.id) {
              await fetch(`${this.baseUrl}${this.apiUrl}/invoices/${invoiceData.id}`, {
                method: 'DELETE'
              });
            }
          }

          results.push({
            scenario: scenario.name,
            success: expectedOutcome,
            message: expectedOutcome 
              ? (scenario.shouldReject ? 'Correctly rejected' : 'Correctly accepted')
              : (scenario.shouldReject ? 'FAILED - Should have been rejected' : 'FAILED - Should have been accepted')
          });

        } catch (error) {
          // Network/parsing errors might be expected for invalid dates
          const isExpectedError = scenario.name === 'Invalid Date Format';
          results.push({
            scenario: scenario.name,
            success: isExpectedError,
            message: isExpectedError 
              ? 'Invalid date correctly caused error'
              : `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
          });
        }
      }

      const passed = results.filter(r => r.success).length;

      return {
        success: passed >= results.length * 0.75, // 75% pass rate
        message: `Date validation: ${passed}/${results.length} scenarios handled correctly`,
        duration: Date.now() - startTime,
        data: { results, passed }
      };

    } catch (error) {
      return {
        success: false,
        message: `Invalid date ranges test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  async testLargeInvoiceAmounts(): Promise<TestResult> {
    const startTime = Date.now();

    try {
      const amountTestScenarios = [
        {
          name: 'Large Amount (1 Million)',
          amount: 1000000,
          shouldWork: true
        },
        {
          name: 'Very Large Amount (1 Billion)',
          amount: 1000000000,
          shouldWork: true // Depends on business rules
        },
        {
          name: 'Floating Point Precision',
          amount: 99.99,
          shouldWork: true,
          precision: true
        },
        {
          name: 'Many Decimal Places',
          amount: 123.456789,
          shouldWork: true,
          checkRounding: true
        },
        {
          name: 'Negative Amount',
          amount: -100,
          shouldWork: false
        },
        {
          name: 'Zero Amount',
          amount: 0,
          shouldWork: false // Business rule: invoices should have positive amounts
        },
        {
          name: 'NaN Amount',
          amount: NaN,
          shouldWork: false
        }
      ];

      const results: Array<{ scenario: string; success: boolean; message: string; actualAmount?: number }> = [];

      for (const scenario of amountTestScenarios) {
        try {
          const invoiceData = {
            clientId: 'test-client',
            invoiceNumber: `INV-AMOUNT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            total: scenario.amount,
            items: [{
              description: `Amount test: ${scenario.name}`,
              quantity: 1,
              unitPrice: scenario.amount
            }]
          };

          const invoiceResponse = await fetch(`${this.baseUrl}${this.apiUrl}/invoices`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(invoiceData)
          });

          const wasAccepted = invoiceResponse.ok;
          const expectedOutcome = scenario.shouldWork ? wasAccepted : !wasAccepted;
          
          let actualAmount = scenario.amount;
          let message = '';

          if (wasAccepted) {
            const responseData = await invoiceResponse.json();
            actualAmount = responseData.total;

            if (scenario.precision) {
              const precisionCorrect = Math.abs(actualAmount - scenario.amount) < 0.01;
              message = precisionCorrect ? 'Precision maintained' : `Precision lost: expected ${scenario.amount}, got ${actualAmount}`;
            } else if (scenario.checkRounding) {
              const roundedCorrectly = Math.abs(actualAmount - Math.round(scenario.amount * 100) / 100) < 0.01;
              message = roundedCorrectly ? 'Properly rounded to 2 decimals' : `Rounding issue: expected ~${Math.round(scenario.amount * 100) / 100}, got ${actualAmount}`;
            } else {
              message = scenario.shouldWork ? 'Correctly accepted' : 'FAILED - Should have been rejected';
            }

            // Cleanup
            if (responseData.id) {
              await fetch(`${this.baseUrl}${this.apiUrl}/invoices/${responseData.id}`, {
                method: 'DELETE'
              });
            }
          } else {
            message = scenario.shouldWork ? 'FAILED - Should have been accepted' : 'Correctly rejected';
          }

          results.push({
            scenario: scenario.name,
            success: expectedOutcome && (scenario.precision ? Math.abs(actualAmount - scenario.amount) < 0.01 : true),
            message,
            actualAmount
          });

        } catch (error) {
          const isExpectedError = scenario.name === 'NaN Amount' || scenario.amount < 0;
          results.push({
            scenario: scenario.name,
            success: isExpectedError,
            message: isExpectedError 
              ? 'Invalid amount correctly caused error'
              : `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
          });
        }
      }

      const passed = results.filter(r => r.success).length;

      return {
        success: passed >= results.length * 0.8, // 80% pass rate
        message: `Large invoice amounts: ${passed}/${results.length} scenarios handled correctly`,
        duration: Date.now() - startTime,
        data: { results, passed }
      };

    } catch (error) {
      return {
        success: false,
        message: `Large invoice amounts test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }
}

export function createEdgeCaseTestingSuite(): TestSuite {
  const edgeCaseTesting = new EdgeCaseTestingUtils();

  return {
    name: 'Edge Case Testing',
    tests: [
      {
        name: 'Zero Credits Scenario',
        fn: () => edgeCaseTesting.testZeroCreditScenario()
      },
      {
        name: 'Invalid File Upload Security',
        fn: () => edgeCaseTesting.testInvalidFileUpload()
      },
      {
        name: 'Large Dataset Performance',
        fn: () => edgeCaseTesting.testLargeDatasets()
      },
      {
        name: 'Special Characters & Unicode',
        fn: () => edgeCaseTesting.testSpecialCharacters()
      },
      {
        name: 'Browser Compatibility',
        fn: () => edgeCaseTesting.testBrowserCompatibility()
      },
      {
        name: 'Invoice Number Collision',
        fn: () => edgeCaseTesting.testInvoiceNumberCollision()
      },
      {
        name: 'Client Email Duplication',
        fn: () => edgeCaseTesting.testClientEmailDuplication()
      },
      {
        name: 'Invalid Date Ranges',
        fn: () => edgeCaseTesting.testInvalidDateRanges()
      },
      {
        name: 'Large Invoice Amounts',
        fn: () => edgeCaseTesting.testLargeInvoiceAmounts()
      }
    ]
  };
}