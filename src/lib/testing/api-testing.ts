import { TestResult, TestSuite, CreditOperation, EmailData } from './types';

export class APITestingUtils {
  private baseUrl: string;
  private apiUrl: string;

  constructor(baseUrl = 'http://localhost:3000', apiUrl = '/api') {
    this.baseUrl = baseUrl;
    this.apiUrl = apiUrl;
  }

  async testInvoiceAPIs(): Promise<TestResult> {
    const startTime = Date.now();
    const endpoints = [
      { method: 'GET', path: '/invoices', name: 'List Invoices' },
      { method: 'POST', path: '/invoices', name: 'Create Invoice', body: this.getMockInvoiceData() },
      { method: 'GET', path: '/invoices/[id]', name: 'Get Invoice', requiresId: true },
      { method: 'PATCH', path: '/invoices/[id]', name: 'Update Invoice', requiresId: true, body: { status: 'sent' } },
      { method: 'DELETE', path: '/invoices/[id]', name: 'Delete Invoice', requiresId: true },
      { method: 'POST', path: '/invoices/[id]/duplicate', name: 'Duplicate Invoice', requiresId: true },
      { method: 'GET', path: '/invoices/[id]/pdf', name: 'Generate PDF', requiresId: true },
      { method: 'POST', path: '/invoices/[id]/send', name: 'Send Invoice', requiresId: true, body: { to: 'test@example.com' } },
      { method: 'PATCH', path: '/invoices/[id]/status', name: 'Update Status', requiresId: true, body: { status: 'paid' } }
    ];

    const results: { endpoint: string; success: boolean; message: string; responseTime: number }[] = [];
    let createdInvoiceId: string | null = null;

    for (const endpoint of endpoints) {
      const endpointStartTime = Date.now();
      
      try {
        let url = `${this.baseUrl}${this.apiUrl}${endpoint.path}`;
        
        // Replace [id] with actual ID
        if (endpoint.requiresId) {
          if (!createdInvoiceId) {
            // Create a test invoice first
            const createResult = await this.createTestInvoice();
            if (!createResult.success) {
              throw new Error('Failed to create test invoice for ID-dependent tests');
            }
            createdInvoiceId = createResult.data?.id;
          }
          url = url.replace('[id]', createdInvoiceId);
        }

        const response = await fetch(url, {
          method: endpoint.method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token' // Add auth if needed
          },
          body: endpoint.body ? JSON.stringify(endpoint.body) : undefined
        });

        const responseTime = Date.now() - endpointStartTime;
        const isSuccess = response.ok || (endpoint.method === 'DELETE' && response.status === 404);

        if (endpoint.method === 'POST' && endpoint.path === '/invoices' && response.ok) {
          const responseData = await response.json();
          createdInvoiceId = responseData.id;
        }

        results.push({
          endpoint: `${endpoint.method} ${endpoint.path}`,
          success: isSuccess,
          message: isSuccess ? endpoint.name : `${endpoint.name} failed: ${response.statusText}`,
          responseTime
        });

      } catch (error) {
        const responseTime = Date.now() - endpointStartTime;
        results.push({
          endpoint: `${endpoint.method} ${endpoint.path}`,
          success: false,
          message: `${endpoint.name} error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          responseTime
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const averageResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;

    return {
      success: successCount === results.length,
      message: `Invoice APIs: ${successCount}/${results.length} passed, avg response time: ${Math.round(averageResponseTime)}ms`,
      duration: Date.now() - startTime,
      data: { results, averageResponseTime, successRate: (successCount / results.length) * 100 }
    };
  }

  async testClientAPIs(): Promise<TestResult> {
    const startTime = Date.now();
    const endpoints = [
      { method: 'GET', path: '/clients', name: 'List Clients' },
      { method: 'POST', path: '/clients', name: 'Create Client', body: this.getMockClientData() },
      { method: 'GET', path: '/clients/[id]', name: 'Get Client', requiresId: true },
      { method: 'PATCH', path: '/clients/[id]', name: 'Update Client', requiresId: true, body: { name: 'Updated Client' } },
      { method: 'DELETE', path: '/clients/[id]', name: 'Delete Client', requiresId: true },
      { method: 'GET', path: '/clients/[id]/invoices', name: 'Client Invoices', requiresId: true },
      { method: 'GET', path: '/clients/[id]/stats', name: 'Client Stats', requiresId: true },
      { method: 'POST', path: '/clients/[id]/toggle-status', name: 'Toggle Status', requiresId: true },
      { method: 'GET', path: '/clients/search', name: 'Search Clients', query: '?q=test' }
    ];

    const results: { endpoint: string; success: boolean; message: string; responseTime: number }[] = [];
    let createdClientId: string | null = null;

    for (const endpoint of endpoints) {
      const endpointStartTime = Date.now();
      
      try {
        let url = `${this.baseUrl}${this.apiUrl}${endpoint.path}`;
        
        if (endpoint.requiresId) {
          if (!createdClientId) {
            const createResult = await this.createTestClient();
            if (!createResult.success) {
              throw new Error('Failed to create test client for ID-dependent tests');
            }
            createdClientId = createResult.data?.id;
          }
          url = url.replace('[id]', createdClientId);
        }

        if (endpoint.query) {
          url += endpoint.query;
        }

        const response = await fetch(url, {
          method: endpoint.method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          },
          body: endpoint.body ? JSON.stringify(endpoint.body) : undefined
        });

        const responseTime = Date.now() - endpointStartTime;
        const isSuccess = response.ok || (endpoint.method === 'DELETE' && response.status === 404);

        if (endpoint.method === 'POST' && endpoint.path === '/clients' && response.ok) {
          const responseData = await response.json();
          createdClientId = responseData.id;
        }

        results.push({
          endpoint: `${endpoint.method} ${endpoint.path}`,
          success: isSuccess,
          message: isSuccess ? endpoint.name : `${endpoint.name} failed: ${response.statusText}`,
          responseTime
        });

      } catch (error) {
        const responseTime = Date.now() - endpointStartTime;
        results.push({
          endpoint: `${endpoint.method} ${endpoint.path}`,
          success: false,
          message: `${endpoint.name} error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          responseTime
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const averageResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;

    return {
      success: successCount === results.length,
      message: `Client APIs: ${successCount}/${results.length} passed, avg response time: ${Math.round(averageResponseTime)}ms`,
      duration: Date.now() - startTime,
      data: { results, averageResponseTime, successRate: (successCount / results.length) * 100 }
    };
  }

  async testUploadAPIs(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      // Test file upload (avatar)
      const testFile = new File(['test content'], 'test.png', { type: 'image/png' });
      const formData = new FormData();
      formData.append('file', testFile);

      const uploadResponse = await fetch(`${this.baseUrl}/api/upload/avatar`, {
        method: 'POST',
        body: formData
      });

      const uploadSuccess = uploadResponse.ok;
      let uploadMessage = 'File upload test ';
      let uploadData = null;

      if (uploadSuccess) {
        uploadData = await uploadResponse.json().catch(() => null);
        uploadMessage += 'passed';
      } else {
        uploadMessage += `failed: ${uploadResponse.statusText}`;
      }

      // Test file validation (invalid file)
      const invalidFile = new File(['malicious content'], 'test.exe', { type: 'application/x-msdownload' });
      const invalidFormData = new FormData();
      invalidFormData.append('file', invalidFile);

      const invalidUploadResponse = await fetch(`${this.baseUrl}/api/upload/avatar`, {
        method: 'POST',
        body: invalidFormData
      });

      // Should reject invalid file
      const validationSuccess = !invalidUploadResponse.ok;
      let validationMessage = 'File validation test ';
      validationMessage += validationSuccess ? 'passed (correctly rejected invalid file)' : 'failed (accepted invalid file)';

      const overallSuccess = uploadSuccess && validationSuccess;
      
      return {
        success: overallSuccess,
        message: `Upload APIs: ${uploadMessage}, ${validationMessage}`,
        duration: Date.now() - startTime,
        data: {
          uploadTest: { success: uploadSuccess, data: uploadData },
          validationTest: { success: validationSuccess }
        }
      };

    } catch (error) {
      return {
        success: false,
        message: `Upload API test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  async testAuthFlow(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      // Test login
      const loginResponse = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'testpassword'
        })
      });

      // Test protected route without auth
      const protectedResponse = await fetch(`${this.baseUrl}${this.apiUrl}/user/profile`);
      const isProtected = protectedResponse.status === 401;

      // Test protected route with auth (if login succeeded)
      let authSuccess = false;
      if (loginResponse.ok) {
        const authData = await loginResponse.json();
        const token = authData.access_token || authData.token;
        
        if (token) {
          const authedResponse = await fetch(`${this.baseUrl}${this.apiUrl}/user/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          authSuccess = authedResponse.ok;
        }
      }

      const results = {
        loginAttempt: loginResponse.ok,
        routeProtection: isProtected,
        authenticatedAccess: authSuccess
      };

      const overallSuccess = isProtected; // Main requirement is route protection
      
      return {
        success: overallSuccess,
        message: `Auth flow: Login ${loginResponse.ok ? 'succeeded' : 'failed'}, Routes ${isProtected ? 'protected' : 'unprotected'}, Auth access ${authSuccess ? 'working' : 'failed'}`,
        duration: Date.now() - startTime,
        data: results
      };

    } catch (error) {
      return {
        success: false,
        message: `Auth flow test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  async testCreditSystem(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      // Test credit balance check
      const balanceResponse = await fetch(`${this.baseUrl}${this.apiUrl}/user/credits`);
      const balanceCheck = balanceResponse.ok;
      
      let initialBalance = 0;
      if (balanceCheck) {
        const balanceData = await balanceResponse.json();
        initialBalance = balanceData.credits || 0;
      }

      // Test credit deduction (simulate invoice creation)
      const deductionResponse = await fetch(`${this.baseUrl}${this.apiUrl}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.getMockInvoiceData())
      });

      let deductionSuccess = false;
      let finalBalance = initialBalance;

      if (deductionResponse.ok) {
        // Check balance after deduction
        const newBalanceResponse = await fetch(`${this.baseUrl}${this.apiUrl}/user/credits`);
        if (newBalanceResponse.ok) {
          const newBalanceData = await newBalanceResponse.json();
          finalBalance = newBalanceData.credits || 0;
          deductionSuccess = finalBalance < initialBalance;
        }
      }

      const results = {
        balanceCheck: balanceCheck,
        initialBalance,
        finalBalance,
        deductionWorking: deductionSuccess
      };

      return {
        success: balanceCheck && deductionSuccess,
        message: `Credit system: Balance check ${balanceCheck ? 'passed' : 'failed'}, Deduction ${deductionSuccess ? 'working' : 'failed'}`,
        duration: Date.now() - startTime,
        data: results
      };

    } catch (error) {
      return {
        success: false,
        message: `Credit system test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  async validateCreditFlow(operations: CreditOperation[]): Promise<TestResult> {
    const startTime = Date.now();
    const results: Array<{ operation: string; success: boolean; message: string }> = [];

    for (const operation of operations) {
      try {
        let result: { success: boolean; message: string };

        switch (operation.type) {
          case 'check':
            result = await this.checkCredits();
            break;
          case 'deduct':
            result = await this.deductCredits(operation.amount || 1, operation.invoiceId);
            break;
          case 'return':
            result = await this.returnCredits(operation.amount || 1, operation.invoiceId);
            break;
          default:
            result = { success: false, message: 'Unknown operation type' };
        }

        results.push({
          operation: `${operation.type}${operation.amount ? ` (${operation.amount})` : ''}`,
          ...result
        });

      } catch (error) {
        results.push({
          operation: operation.type,
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const overallSuccess = successCount === results.length;

    return {
      success: overallSuccess,
      message: `Credit operations: ${successCount}/${results.length} successful`,
      duration: Date.now() - startTime,
      data: { operations: results, successRate: (successCount / results.length) * 100 }
    };
  }

  async validateEmailFlow(emailData: EmailData): Promise<TestResult> {
    const startTime = Date.now();

    try {
      const response = await fetch(`${this.baseUrl}${this.apiUrl}/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emailData.to,
          subject: emailData.subject,
          body: emailData.body,
          attachments: emailData.attachments?.map(file => ({
            filename: file.name,
            content: file.name // Mock attachment
          }))
        })
      });

      const emailSent = response.ok;
      let responseData = null;

      if (emailSent) {
        responseData = await response.json().catch(() => null);
      }

      return {
        success: emailSent,
        message: emailSent ? 'Email sent successfully' : `Email send failed: ${response.statusText}`,
        duration: Date.now() - startTime,
        data: responseData
      };

    } catch (error) {
      return {
        success: false,
        message: `Email flow test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  async validatePDFGeneration(invoiceId: string): Promise<TestResult> {
    const startTime = Date.now();

    try {
      const response = await fetch(`${this.baseUrl}${this.apiUrl}/invoices/${invoiceId}/pdf`);
      
      const pdfGenerated = response.ok;
      const contentType = response.headers.get('content-type');
      const isPDF = contentType?.includes('application/pdf');

      let fileSize = 0;
      if (pdfGenerated) {
        const blob = await response.blob();
        fileSize = blob.size;
      }

      const success = pdfGenerated && isPDF && fileSize > 0;

      return {
        success,
        message: success 
          ? `PDF generated successfully (${fileSize} bytes)`
          : `PDF generation failed: ${!pdfGenerated ? 'Request failed' : !isPDF ? 'Wrong content type' : 'Empty file'}`,
        duration: Date.now() - startTime,
        data: { fileSize, contentType }
      };

    } catch (error) {
      return {
        success: false,
        message: `PDF generation test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  private async checkCredits(): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}${this.apiUrl}/user/credits`);
    
    if (!response.ok) {
      return { success: false, message: 'Failed to check credits' };
    }

    const data = await response.json();
    return { 
      success: true, 
      message: `Current credits: ${data.credits || 0}` 
    };
  }

  private async deductCredits(amount: number, invoiceId?: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}${this.apiUrl}/user/credits`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'deduct', 
        amount,
        invoiceId 
      })
    });

    return {
      success: response.ok,
      message: response.ok ? `Deducted ${amount} credits` : 'Failed to deduct credits'
    };
  }

  private async returnCredits(amount: number, invoiceId?: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}${this.apiUrl}/user/credits`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'return', 
        amount,
        invoiceId 
      })
    });

    return {
      success: response.ok,
      message: response.ok ? `Returned ${amount} credits` : 'Failed to return credits'
    };
  }

  private async createTestInvoice(): Promise<TestResult> {
    const response = await fetch(`${this.baseUrl}${this.apiUrl}/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.getMockInvoiceData())
    });

    if (!response.ok) {
      return { success: false, message: 'Failed to create test invoice', duration: 0 };
    }

    const data = await response.json();
    return { success: true, message: 'Test invoice created', duration: 0, data };
  }

  private async createTestClient(): Promise<TestResult> {
    const response = await fetch(`${this.baseUrl}${this.apiUrl}/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.getMockClientData())
    });

    if (!response.ok) {
      return { success: false, message: 'Failed to create test client', duration: 0 };
    }

    const data = await response.json();
    return { success: true, message: 'Test client created', duration: 0, data };
  }

  private getMockInvoiceData() {
    return {
      clientId: 'test-client-1',
      invoiceNumber: `INV-${Date.now()}`,
      issueDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      items: [
        {
          description: 'Test Service',
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
      name: `Test Client ${Date.now()}`,
      email: `test${Date.now()}@example.com`,
      phone: '+995555123456',
      address: 'Test Address, Tbilisi, Georgia'
    };
  }
}

export function createAPITestingSuite(): TestSuite {
  const apiTesting = new APITestingUtils();

  return {
    name: 'API Integration Testing',
    tests: [
      {
        name: 'Invoice API Endpoints',
        fn: () => apiTesting.testInvoiceAPIs()
      },
      {
        name: 'Client API Endpoints', 
        fn: () => apiTesting.testClientAPIs()
      },
      {
        name: 'File Upload APIs',
        fn: () => apiTesting.testUploadAPIs()
      },
      {
        name: 'Authentication Flow',
        fn: () => apiTesting.testAuthFlow()
      },
      {
        name: 'Credit System APIs',
        fn: () => apiTesting.testCreditSystem()
      },
      {
        name: 'Email System Integration',
        fn: () => apiTesting.validateEmailFlow({
          to: 'test@example.com',
          subject: 'Test Invoice',
          body: 'Please find your invoice attached.',
          attachments: []
        })
      }
    ]
  };
}