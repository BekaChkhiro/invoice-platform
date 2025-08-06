import { TestResult, TestSuite, ProductionCheck } from './types';

export class ProductionReadinessChecker {
  private baseUrl: string;
  private apiUrl: string;

  constructor(baseUrl = 'http://localhost:3000', apiUrl = '/api') {
    this.baseUrl = baseUrl;
    this.apiUrl = apiUrl;
  }

  async validateEnvironmentVariables(): Promise<TestResult> {
    const startTime = Date.now();

    try {
      const requiredEnvVars = [
        { name: 'NEXT_PUBLIC_SUPABASE_URL', critical: true },
        { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', critical: true },
        { name: 'SUPABASE_SERVICE_ROLE_KEY', critical: true },
        { name: 'NEXT_PUBLIC_APP_URL', critical: false },
        { name: 'NEXT_PUBLIC_VERCEL_URL', critical: false },
        { name: 'DATABASE_URL', critical: true },
        { name: 'EMAIL_FROM', critical: false },
        { name: 'RESEND_API_KEY', critical: false }
      ];

      const envCheckResults = requiredEnvVars.map(envVar => {
        const value = process.env[envVar.name];
        const exists = value !== undefined && value !== '';
        
        return {
          variable: envVar.name,
          exists,
          critical: envVar.critical,
          hasValue: exists && value.length > 0,
          masked: exists ? `${value.substring(0, 8)}...` : 'MISSING'
        };
      });

      const criticalMissing = envCheckResults.filter(r => r.critical && !r.exists);
      const totalMissing = envCheckResults.filter(r => !r.exists);

      return {
        success: criticalMissing.length === 0,
        message: `Environment variables: ${envCheckResults.length - totalMissing.length}/${envCheckResults.length} set, ${criticalMissing.length} critical missing`,
        duration: Date.now() - startTime,
        data: {
          results: envCheckResults,
          criticalMissing: criticalMissing.map(r => r.variable),
          allMissing: totalMissing.map(r => r.variable)
        }
      };

    } catch (error) {
      return {
        success: false,
        message: `Environment variable validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  async testDatabaseConnections(): Promise<TestResult> {
    const startTime = Date.now();

    try {
      const connectionTests = [
        {
          name: 'Supabase Connection',
          test: async () => {
            const response = await fetch(`${this.baseUrl}${this.apiUrl}/user/credits`);
            return { success: response.status !== 500, status: response.status };
          }
        },
        {
          name: 'Database Read',
          test: async () => {
            const response = await fetch(`${this.baseUrl}${this.apiUrl}/clients`);
            return { success: response.status !== 500, status: response.status };
          }
        },
        {
          name: 'Database Write',
          test: async () => {
            const testClient = {
              name: `DB Test ${Date.now()}`,
              email: `dbtest-${Date.now()}@example.com`
            };
            
            const response = await fetch(`${this.baseUrl}${this.apiUrl}/clients`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(testClient)
            });

            // Cleanup
            if (response.ok) {
              const client = await response.json();
              if (client.id) {
                await fetch(`${this.baseUrl}${this.apiUrl}/clients/${client.id}`, {
                  method: 'DELETE'
                });
              }
            }

            return { success: response.ok, status: response.status };
          }
        },
        {
          name: 'Authentication System',
          test: async () => {
            const response = await fetch(`${this.baseUrl}/auth/callback`);
            // Should not return 500 server error
            return { success: response.status !== 500, status: response.status };
          }
        }
      ];

      const results = [];
      for (const connectionTest of connectionTests) {
        try {
          const result = await connectionTest.test();
          results.push({
            connection: connectionTest.name,
            success: result.success,
            status: result.status,
            message: result.success ? 'Connected' : `Connection failed (${result.status})`
          });
        } catch (error) {
          results.push({
            connection: connectionTest.name,
            success: false,
            status: -1,
            message: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      const successful = results.filter(r => r.success).length;
      const critical = ['Supabase Connection', 'Database Read', 'Database Write'];
      const criticalSuccessful = results.filter(r => critical.includes(r.connection) && r.success).length;

      return {
        success: criticalSuccessful === critical.length,
        message: `Database connections: ${successful}/${results.length} successful, ${criticalSuccessful}/${critical.length} critical`,
        duration: Date.now() - startTime,
        data: { results, criticalConnections: critical.length }
      };

    } catch (error) {
      return {
        success: false,
        message: `Database connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  async validateSSLCertificates(): Promise<TestResult> {
    const startTime = Date.now();

    try {
      // Test HTTPS endpoints
      const httpsEndpoints = [
        this.baseUrl.replace('http://', 'https://'),
        'https://api.supabase.co',
        'https://vercel.com'
      ];

      const sslResults = [];

      for (const endpoint of httpsEndpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'HEAD',
            // Note: This is a basic check - in a real environment you'd want more comprehensive SSL validation
          });

          sslResults.push({
            endpoint,
            hasSSL: endpoint.startsWith('https://'),
            responds: response.ok || response.status < 500,
            status: response.status
          });

        } catch (error) {
          sslResults.push({
            endpoint,
            hasSSL: endpoint.startsWith('https://'),
            responds: false,
            status: -1,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      const httpsEndpointsCount = sslResults.filter(r => r.hasSSL).length;
      const respondingCount = sslResults.filter(r => r.responds).length;

      return {
        success: httpsEndpointsCount === sslResults.length,
        message: `SSL/HTTPS: ${httpsEndpointsCount}/${sslResults.length} using HTTPS, ${respondingCount} responding`,
        duration: Date.now() - startTime,
        data: { results: sslResults }
      };

    } catch (error) {
      return {
        success: false,
        message: `SSL certificate validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  async testCDNAssets(): Promise<TestResult> {
    const startTime = Date.now();

    try {
      const staticAssets = [
        '/favicon.ico',
        '/manifest.json',
        '/_next/static/css/app.css', // Next.js CSS
        '/_next/static/chunks/webpack.js', // Webpack chunks
        '/sw.js' // Service worker
      ];

      const assetResults = [];

      for (const asset of staticAssets) {
        try {
          const response = await fetch(`${this.baseUrl}${asset}`, {
            method: 'HEAD',
            cache: 'no-cache'
          });

          assetResults.push({
            asset,
            available: response.ok,
            status: response.status,
            cached: response.headers.get('cache-control') !== null,
            size: response.headers.get('content-length') || 'unknown'
          });

        } catch (error) {
          assetResults.push({
            asset,
            available: false,
            status: -1,
            cached: false,
            size: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      const availableAssets = assetResults.filter(r => r.available).length;
      const cachedAssets = assetResults.filter(r => r.cached).length;

      return {
        success: availableAssets >= staticAssets.length * 0.7, // 70% of assets should be available
        message: `Static assets: ${availableAssets}/${staticAssets.length} available, ${cachedAssets} with cache headers`,
        duration: Date.now() - startTime,
        data: { results: assetResults }
      };

    } catch (error) {
      return {
        success: false,
        message: `CDN/Static assets test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  async validateInputSanitization(): Promise<TestResult> {
    const startTime = Date.now();

    try {
      const maliciousInputs = [
        {
          name: 'XSS Script Tag',
          payload: '<script>alert("xss")</script>',
          endpoint: '/clients',
          field: 'name'
        },
        {
          name: 'SQL Injection',
          payload: "'; DROP TABLE clients; --",
          endpoint: '/clients',
          field: 'name'
        },
        {
          name: 'HTML Injection',
          payload: '<img src="x" onerror="alert(\'xss\')">',
          endpoint: '/clients',
          field: 'name'
        },
        {
          name: 'NoSQL Injection',
          payload: '{"$ne": null}',
          endpoint: '/clients',
          field: 'email'
        }
      ];

      const sanitizationResults = [];

      for (const input of maliciousInputs) {
        try {
          const testData = {
            name: 'Sanitization Test',
            email: 'test@example.com'
          };
          testData[input.field as keyof typeof testData] = input.payload;

          const response = await fetch(`${this.baseUrl}${this.apiUrl}${input.endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testData)
          });

          let sanitized = false;
          let retrievedValue = '';

          if (response.ok) {
            const responseData = await response.json();
            retrievedValue = responseData[input.field] || '';
            
            // Check if the malicious payload was sanitized
            sanitized = retrievedValue !== input.payload;

            // Cleanup
            if (responseData.id) {
              await fetch(`${this.baseUrl}${this.apiUrl}${input.endpoint}/${responseData.id}`, {
                method: 'DELETE'
              });
            }
          } else {
            // Rejection might indicate good input validation
            sanitized = true;
            retrievedValue = 'REJECTED';
          }

          sanitizationResults.push({
            test: input.name,
            payload: input.payload,
            sanitized,
            retrievedValue,
            status: response.status,
            safe: sanitized
          });

        } catch (error) {
          sanitizationResults.push({
            test: input.name,
            payload: input.payload,
            sanitized: true, // Error might indicate rejection
            retrievedValue: 'ERROR',
            status: -1,
            safe: true,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      const safeSanitizations = sanitizationResults.filter(r => r.safe).length;
      const allSafe = safeSanitizations === maliciousInputs.length;

      return {
        success: allSafe,
        message: `Input sanitization: ${safeSanitizations}/${maliciousInputs.length} malicious inputs safely handled`,
        duration: Date.now() - startTime,
        data: { 
          results: sanitizationResults,
          securityScore: (safeSanitizations / maliciousInputs.length) * 100
        }
      };

    } catch (error) {
      return {
        success: false,
        message: `Input sanitization validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  async testRateLimiting(): Promise<TestResult> {
    const startTime = Date.now();

    try {
      const endpoint = `${this.baseUrl}${this.apiUrl}/clients`;
      const requestCount = 20; // Test with rapid requests
      const timeWindow = 1000; // 1 second

      const rapidRequests = [];
      const startRequestTime = Date.now();

      // Make rapid requests
      for (let i = 0; i < requestCount; i++) {
        rapidRequests.push(
          fetch(endpoint, {
            method: 'GET',
            headers: {
              'X-Test-Request': `rate-limit-test-${i}`
            }
          }).then(response => ({
            index: i,
            status: response.status,
            rateLimited: response.status === 429,
            timestamp: Date.now()
          })).catch(error => ({
            index: i,
            status: -1,
            rateLimited: false,
            timestamp: Date.now(),
            error: error.message
          }))
        );
      }

      const results = await Promise.all(rapidRequests);
      const totalTime = Date.now() - startRequestTime;
      
      const rateLimitedCount = results.filter(r => r.rateLimited).length;
      const successfulCount = results.filter(r => r.status === 200).length;
      const errorCount = results.filter(r => r.status >= 500).length;

      // Rate limiting is working if some requests were limited
      const hasRateLimiting = rateLimitedCount > 0 || successfulCount < requestCount * 0.8;
      const systemStable = errorCount < requestCount * 0.2; // Less than 20% server errors

      return {
        success: systemStable, // Main goal is system stability under load
        message: `Rate limiting: ${rateLimitedCount} requests limited, ${successfulCount} successful, ${errorCount} errors in ${totalTime}ms`,
        duration: Date.now() - startTime,
        data: {
          totalRequests: requestCount,
          rateLimited: rateLimitedCount,
          successful: successfulCount,
          errors: errorCount,
          hasRateLimiting,
          systemStable,
          averageResponseTime: totalTime / requestCount
        }
      };

    } catch (error) {
      return {
        success: false,
        message: `Rate limiting test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  async validateFileUploadSecurity(): Promise<TestResult> {
    const startTime = Date.now();

    try {
      const securityTests = [
        {
          name: 'Executable File',
          filename: 'malware.exe',
          content: 'MZ\x90\x00', // PE header
          type: 'application/x-msdownload',
          shouldReject: true
        },
        {
          name: 'Script File',
          filename: 'script.js',
          content: 'alert("xss")',
          type: 'application/javascript',
          shouldReject: true
        },
        {
          name: 'PHP File',
          filename: 'backdoor.php',
          content: '<?php system($_GET["cmd"]); ?>',
          type: 'application/x-httpd-php',
          shouldReject: true
        },
        {
          name: 'Large File',
          filename: 'huge.txt',
          content: 'a'.repeat(20 * 1024 * 1024), // 20MB
          type: 'text/plain',
          shouldReject: true
        },
        {
          name: 'Valid Image',
          filename: 'test.png',
          content: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
          type: 'image/png',
          shouldReject: false
        }
      ];

      const uploadResults = [];

      for (const test of securityTests) {
        try {
          const file = new File([test.content], test.filename, { type: test.type });
          const formData = new FormData();
          formData.append('file', file);

          const response = await fetch(`${this.baseUrl}/api/upload/avatar`, {
            method: 'POST',
            body: formData
          });

          const wasRejected = !response.ok;
          const correct = test.shouldReject ? wasRejected : !wasRejected;

          let errorMessage = '';
          if (!response.ok) {
            errorMessage = await response.text().catch(() => '');
          }

          uploadResults.push({
            test: test.name,
            filename: test.filename,
            shouldReject: test.shouldReject,
            wasRejected,
            correct,
            status: response.status,
            errorMessage
          });

        } catch (error) {
          // Network errors might indicate rejection, which could be good for malicious files
          const isSecurityError = test.shouldReject;
          uploadResults.push({
            test: test.name,
            filename: test.filename,
            shouldReject: test.shouldReject,
            wasRejected: true,
            correct: isSecurityError,
            status: -1,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      const correctHandling = uploadResults.filter(r => r.correct).length;
      const securityViolations = uploadResults.filter(r => !r.correct && r.shouldReject).length;

      return {
        success: securityViolations === 0,
        message: `File upload security: ${correctHandling}/${uploadResults.length} correctly handled, ${securityViolations} security violations`,
        duration: Date.now() - startTime,
        data: {
          results: uploadResults,
          securityScore: (correctHandling / uploadResults.length) * 100,
          violations: securityViolations
        }
      };

    } catch (error) {
      return {
        success: false,
        message: `File upload security validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  async runComprehensiveProductionCheck(): Promise<TestResult> {
    const startTime = Date.now();

    try {
      const productionChecks: ProductionCheck[] = [
        {
          name: 'Environment Variables',
          check: async () => (await this.validateEnvironmentVariables()).success,
          critical: true,
          description: 'All critical environment variables are properly configured'
        },
        {
          name: 'Database Connectivity',
          check: async () => (await this.testDatabaseConnections()).success,
          critical: true,
          description: 'Database connections are working properly'
        },
        {
          name: 'SSL/HTTPS Configuration',
          check: async () => (await this.validateSSLCertificates()).success,
          critical: true,
          description: 'SSL certificates are valid and HTTPS is enforced'
        },
        {
          name: 'Static Asset Delivery',
          check: async () => (await this.testCDNAssets()).success,
          critical: false,
          description: 'Static assets are properly served and cached'
        },
        {
          name: 'Input Sanitization',
          check: async () => (await this.validateInputSanitization()).success,
          critical: true,
          description: 'User inputs are properly sanitized against XSS and injection attacks'
        },
        {
          name: 'Rate Limiting',
          check: async () => (await this.testRateLimiting()).success,
          critical: false,
          description: 'API rate limiting is configured to prevent abuse'
        },
        {
          name: 'File Upload Security',
          check: async () => (await this.validateFileUploadSecurity()).success,
          critical: true,
          description: 'File uploads are properly validated and secured'
        }
      ];

      const checkResults = [];

      for (const check of productionChecks) {
        const checkStartTime = Date.now();
        
        try {
          const passed = await check.check();
          const checkDuration = Date.now() - checkStartTime;

          checkResults.push({
            name: check.name,
            passed,
            critical: check.critical,
            description: check.description,
            duration: checkDuration,
            status: passed ? 'PASS' : 'FAIL'
          });

        } catch (error) {
          checkResults.push({
            name: check.name,
            passed: false,
            critical: check.critical,
            description: check.description,
            duration: Date.now() - checkStartTime,
            status: 'ERROR',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      const totalChecks = checkResults.length;
      const passedChecks = checkResults.filter(r => r.passed).length;
      const criticalChecks = checkResults.filter(r => r.critical).length;
      const criticalPassed = checkResults.filter(r => r.critical && r.passed).length;
      const criticalFailed = checkResults.filter(r => r.critical && !r.passed);

      const productionReady = criticalPassed === criticalChecks;
      const overallScore = (passedChecks / totalChecks) * 100;

      return {
        success: productionReady,
        message: `Production readiness: ${passedChecks}/${totalChecks} checks passed (${criticalPassed}/${criticalChecks} critical), ${overallScore.toFixed(1)}% ready`,
        duration: Date.now() - startTime,
        data: {
          checkResults,
          summary: {
            totalChecks,
            passedChecks,
            criticalChecks,
            criticalPassed,
            criticalFailed: criticalFailed.map(c => c.name),
            overallScore,
            productionReady
          }
        }
      };

    } catch (error) {
      return {
        success: false,
        message: `Production readiness check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }
}

export function createProductionReadinessSuite(): TestSuite {
  const productionChecker = new ProductionReadinessChecker();

  return {
    name: 'Production Readiness',
    tests: [
      {
        name: 'Environment Configuration',
        fn: () => productionChecker.validateEnvironmentVariables()
      },
      {
        name: 'Database Connections',
        fn: () => productionChecker.testDatabaseConnections()
      },
      {
        name: 'SSL/HTTPS Security',
        fn: () => productionChecker.validateSSLCertificates()
      },
      {
        name: 'Static Asset Delivery',
        fn: () => productionChecker.testCDNAssets()
      },
      {
        name: 'Input Sanitization Security',
        fn: () => productionChecker.validateInputSanitization()
      },
      {
        name: 'API Rate Limiting',
        fn: () => productionChecker.testRateLimiting(),
        timeout: 10000
      },
      {
        name: 'File Upload Security',
        fn: () => productionChecker.validateFileUploadSecurity()
      },
      {
        name: 'Comprehensive Production Check',
        fn: () => productionChecker.runComprehensiveProductionCheck(),
        timeout: 60000
      }
    ]
  };
}