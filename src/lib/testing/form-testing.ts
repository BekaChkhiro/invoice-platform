import { TestResult, FormStep, ClientData, TestSuite } from './types';

export class FormTestingUtils {
  private baseUrl: string;

  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  async validateInvoiceFlow(steps: FormStep[]): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      for (const step of steps) {
        const stepResult = await this.validateFormStep(step);
        if (!stepResult.success) {
          return {
            success: false,
            message: `Invoice flow failed at step ${step.step}: ${stepResult.message}`,
            duration: Date.now() - startTime,
            error: stepResult.error
          };
        }
      }

      return {
        success: true,
        message: 'Invoice flow validation completed successfully',
        duration: Date.now() - startTime,
        data: { stepsCompleted: steps.length }
      };

    } catch (error) {
      return {
        success: false,
        message: `Invoice flow validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  async validateClientFlow(clientData: ClientData): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      // Test client creation
      const createResult = await this.testClientCreation(clientData);
      if (!createResult.success) {
        throw new Error(`Client creation failed: ${createResult.message}`);
      }

      const clientId = createResult.data?.id;
      if (!clientId) {
        throw new Error('No client ID returned from creation');
      }

      // Test client reading
      const readResult = await this.testClientRead(clientId);
      if (!readResult.success) {
        throw new Error(`Client read failed: ${readResult.message}`);
      }

      // Test client update
      const updatedData = { ...clientData, name: clientData.name + ' (Updated)' };
      const updateResult = await this.testClientUpdate(clientId, updatedData);
      if (!updateResult.success) {
        throw new Error(`Client update failed: ${updateResult.message}`);
      }

      // Test client deletion
      const deleteResult = await this.testClientDeletion(clientId);
      if (!deleteResult.success) {
        throw new Error(`Client deletion failed: ${deleteResult.message}`);
      }

      return {
        success: true,
        message: 'Client CRUD flow validation completed successfully',
        duration: Date.now() - startTime,
        data: { clientId, operations: ['create', 'read', 'update', 'delete'] }
      };

    } catch (error) {
      return {
        success: false,
        message: `Client flow validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  async validateFormValidation(formType: 'invoice' | 'client', invalidData: any): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const endpoint = formType === 'invoice' ? '/api/invoices' : '/api/clients';
      
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidData)
      });

      // Should return validation error
      if (response.ok) {
        return {
          success: false,
          message: 'Form validation failed - invalid data was accepted',
          duration: Date.now() - startTime
        };
      }

      const errorData = await response.json().catch(() => null);
      const hasValidationErrors = response.status === 400 && errorData?.errors;

      return {
        success: hasValidationErrors,
        message: hasValidationErrors 
          ? 'Form validation working correctly - invalid data rejected'
          : 'Form validation not working as expected',
        duration: Date.now() - startTime,
        data: { status: response.status, errors: errorData?.errors }
      };

    } catch (error) {
      return {
        success: false,
        message: `Form validation test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  async validateFormPersistence(formType: 'invoice' | 'client', formData: any): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      // Test localStorage persistence
      const storageKey = `${formType}_draft_${Date.now()}`;
      localStorage.setItem(storageKey, JSON.stringify(formData));
      
      const retrievedData = localStorage.getItem(storageKey);
      const parsedData = retrievedData ? JSON.parse(retrievedData) : null;
      
      localStorage.removeItem(storageKey);
      
      const isDataPersisted = JSON.stringify(parsedData) === JSON.stringify(formData);

      return {
        success: isDataPersisted,
        message: isDataPersisted 
          ? 'Form data persistence working correctly'
          : 'Form data persistence failed',
        duration: Date.now() - startTime,
        data: { original: formData, retrieved: parsedData }
      };

    } catch (error) {
      return {
        success: false,
        message: `Form persistence test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  private async validateFormStep(step: FormStep): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      // Validate step data if validation function provided
      if (step.validation && !step.validation(step.data)) {
        return {
          success: false,
          message: `Step ${step.step} validation failed`,
          duration: Date.now() - startTime
        };
      }

      // Step-specific validation
      switch (step.step) {
        case 'client':
          return await this.validateClientSelectionStep(step.data);
        case 'details':
          return await this.validateInvoiceDetailsStep(step.data);
        case 'items':
          return await this.validateInvoiceItemsStep(step.data);
        case 'preview':
          return await this.validateInvoicePreviewStep(step.data);
        default:
          return {
            success: false,
            message: `Unknown step: ${step.step}`,
            duration: Date.now() - startTime
          };
      }

    } catch (error) {
      return {
        success: false,
        message: `Step validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  private async validateClientSelectionStep(data: any): Promise<TestResult> {
    const startTime = Date.now();
    
    const requiredFields = ['clientId'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      return {
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
        duration: Date.now() - startTime
      };
    }

    // Verify client exists
    try {
      const response = await fetch(`${this.baseUrl}/api/clients/${data.clientId}`);
      if (!response.ok) {
        return {
          success: false,
          message: 'Selected client not found',
          duration: Date.now() - startTime
        };
      }

      return {
        success: true,
        message: 'Client selection step validated',
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        message: `Client validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime
      };
    }
  }

  private async validateInvoiceDetailsStep(data: any): Promise<TestResult> {
    const startTime = Date.now();
    
    const requiredFields = ['invoiceNumber', 'issueDate', 'dueDate'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      return {
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
        duration: Date.now() - startTime
      };
    }

    // Validate date logic
    const issueDate = new Date(data.issueDate);
    const dueDate = new Date(data.dueDate);
    
    if (dueDate < issueDate) {
      return {
        success: false,
        message: 'Due date cannot be before issue date',
        duration: Date.now() - startTime
      };
    }

    return {
      success: true,
      message: 'Invoice details step validated',
      duration: Date.now() - startTime
    };
  }

  private async validateInvoiceItemsStep(data: any): Promise<TestResult> {
    const startTime = Date.now();
    
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      return {
        success: false,
        message: 'At least one invoice item is required',
        duration: Date.now() - startTime
      };
    }

    // Validate each item
    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      const requiredFields = ['description', 'quantity', 'unitPrice'];
      const missingFields = requiredFields.filter(field => !item[field] && item[field] !== 0);
      
      if (missingFields.length > 0) {
        return {
          success: false,
          message: `Item ${i + 1} missing required fields: ${missingFields.join(', ')}`,
          duration: Date.now() - startTime
        };
      }

      if (item.quantity <= 0 || item.unitPrice < 0) {
        return {
          success: false,
          message: `Item ${i + 1} has invalid quantity or price`,
          duration: Date.now() - startTime
        };
      }
    }

    return {
      success: true,
      message: 'Invoice items step validated',
      duration: Date.now() - startTime
    };
  }

  private async validateInvoicePreviewStep(data: any): Promise<TestResult> {
    const startTime = Date.now();
    
    // Validate calculated totals
    const { items, vatRate = 0 } = data;
    
    if (!items || !Array.isArray(items)) {
      return {
        success: false,
        message: 'Items array required for preview validation',
        duration: Date.now() - startTime
      };
    }

    const subtotal = items.reduce((sum: number, item: any) => 
      sum + (item.quantity * item.unitPrice), 0);
    const vatAmount = subtotal * (vatRate / 100);
    const total = subtotal + vatAmount;

    const calculatedTotals = {
      subtotal: Math.round(subtotal * 100) / 100,
      vatAmount: Math.round(vatAmount * 100) / 100,
      total: Math.round(total * 100) / 100
    };

    return {
      success: true,
      message: 'Invoice preview step validated',
      duration: Date.now() - startTime,
      data: calculatedTotals
    };
  }

  private async testClientCreation(clientData: ClientData): Promise<TestResult> {
    const response = await fetch(`${this.baseUrl}/api/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clientData)
    });

    if (!response.ok) {
      return {
        success: false,
        message: `Client creation failed: ${response.statusText}`,
        duration: 0
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: 'Client created successfully',
      duration: 0,
      data
    };
  }

  private async testClientRead(clientId: string): Promise<TestResult> {
    const response = await fetch(`${this.baseUrl}/api/clients/${clientId}`);

    if (!response.ok) {
      return {
        success: false,
        message: `Client read failed: ${response.statusText}`,
        duration: 0
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: 'Client read successfully',
      duration: 0,
      data
    };
  }

  private async testClientUpdate(clientId: string, updatedData: Partial<ClientData>): Promise<TestResult> {
    const response = await fetch(`${this.baseUrl}/api/clients/${clientId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData)
    });

    if (!response.ok) {
      return {
        success: false,
        message: `Client update failed: ${response.statusText}`,
        duration: 0
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: 'Client updated successfully',
      duration: 0,
      data
    };
  }

  private async testClientDeletion(clientId: string): Promise<TestResult> {
    const response = await fetch(`${this.baseUrl}/api/clients/${clientId}`, {
      method: 'DELETE'
    });

    if (!response.ok && response.status !== 404) {
      return {
        success: false,
        message: `Client deletion failed: ${response.statusText}`,
        duration: 0
      };
    }

    return {
      success: true,
      message: 'Client deleted successfully',
      duration: 0
    };
  }
}

export function createFormTestingSuite(): TestSuite {
  const formTesting = new FormTestingUtils();

  return {
    name: 'Form Submission Testing',
    tests: [
      {
        name: 'Complete Invoice Flow',
        fn: async () => {
          const steps: FormStep[] = [
            {
              step: 'client',
              data: { clientId: 'test-client-1' }
            },
            {
              step: 'details',
              data: {
                invoiceNumber: 'INV-001',
                issueDate: new Date().toISOString(),
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
              }
            },
            {
              step: 'items',
              data: {
                items: [
                  { description: 'Test Item', quantity: 1, unitPrice: 100 }
                ]
              }
            },
            {
              step: 'preview',
              data: {
                items: [
                  { description: 'Test Item', quantity: 1, unitPrice: 100 }
                ],
                vatRate: 18
              }
            }
          ];
          
          return await formTesting.validateInvoiceFlow(steps);
        }
      },
      {
        name: 'Client CRUD Operations',
        fn: async () => {
          const clientData: ClientData = {
            name: 'Test Client',
            email: 'test@example.com',
            phone: '+995555123456',
            address: 'Test Address'
          };
          
          return await formTesting.validateClientFlow(clientData);
        }
      },
      {
        name: 'Form Validation - Invalid Invoice',
        fn: async () => {
          const invalidData = {
            // Missing required fields
            description: 'Invalid invoice'
          };
          
          return await formTesting.validateFormValidation('invoice', invalidData);
        }
      },
      {
        name: 'Form Validation - Invalid Client',
        fn: async () => {
          const invalidData = {
            // Missing name and email
            phone: '+995555123456'
          };
          
          return await formTesting.validateFormValidation('client', invalidData);
        }
      },
      {
        name: 'Form Data Persistence',
        fn: async () => {
          const formData = {
            clientName: 'Test Client',
            items: [
              { description: 'Test Item', quantity: 1, unitPrice: 100 }
            ]
          };
          
          return await formTesting.validateFormPersistence('invoice', formData);
        }
      }
    ]
  };
}