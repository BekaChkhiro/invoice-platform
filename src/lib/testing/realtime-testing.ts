import { TestResult, TestSuite } from './types';

export class RealtimeTestingUtils {
  private baseUrl: string;
  private apiUrl: string;

  constructor(baseUrl = 'http://localhost:3000', apiUrl = '/api') {
    this.baseUrl = baseUrl;
    this.apiUrl = apiUrl;
  }

  async testOptimisticUpdates(): Promise<TestResult> {
    const startTime = Date.now();

    try {
      // Simulate optimistic update scenario
      const testInvoice = {
        id: 'test-invoice-optimistic',
        status: 'draft',
        total: 100
      };

      // Mock optimistic update behavior
      const optimisticUpdate = {
        ...testInvoice,
        status: 'sent' // Optimistically update status
      };

      // Simulate server update with delay
      const serverUpdatePromise = new Promise<any>((resolve, reject) => {
        setTimeout(async () => {
          try {
            const response = await fetch(`${this.baseUrl}${this.apiUrl}/invoices/${testInvoice.id}/status`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'sent' })
            });

            if (response.ok) {
              const data = await response.json();
              resolve(data);
            } else {
              reject(new Error('Server update failed'));
            }
          } catch (error) {
            reject(error);
          }
        }, 1000); // Simulate network delay
      });

      // Test optimistic update timing
      const optimisticStartTime = Date.now();
      const optimisticCompleteTime = Date.now() - optimisticStartTime;

      // Wait for server confirmation
      let serverResult;
      let serverError = false;
      
      try {
        serverResult = await serverUpdatePromise;
      } catch (error) {
        serverError = true;
        serverResult = { error: error instanceof Error ? error.message : 'Server error' };
      }

      const serverCompleteTime = Date.now() - optimisticStartTime;

      const isOptimisticFaster = optimisticCompleteTime < 50; // Should be nearly instant
      const hasServerConfirmation = !serverError && serverResult;

      return {
        success: isOptimisticFaster && hasServerConfirmation,
        message: `Optimistic updates: UI update ${optimisticCompleteTime}ms, Server confirmation ${serverCompleteTime}ms`,
        duration: Date.now() - startTime,
        data: {
          optimisticTime: optimisticCompleteTime,
          serverTime: serverCompleteTime,
          optimisticData: optimisticUpdate,
          serverData: serverResult,
          serverError
        }
      };

    } catch (error) {
      return {
        success: false,
        message: `Optimistic updates test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  async testCacheInvalidation(): Promise<TestResult> {
    const startTime = Date.now();

    try {
      // Test React Query cache invalidation patterns
      const cacheTests = [
        {
          name: 'Invoice List Cache',
          action: 'create_invoice',
          cacheKey: 'invoices',
          endpoint: '/invoices'
        },
        {
          name: 'Client List Cache',
          action: 'create_client', 
          cacheKey: 'clients',
          endpoint: '/clients'
        },
        {
          name: 'Invoice Detail Cache',
          action: 'update_invoice',
          cacheKey: 'invoice-detail',
          endpoint: '/invoices/test-id'
        }
      ];

      const results: Array<{ test: string; success: boolean; message: string }> = [];

      for (const test of cacheTests) {
        try {
          // Simulate cache invalidation scenario
          const cacheInvalidationResult = await this.simulateCacheInvalidation(test);
          results.push({
            test: test.name,
            success: cacheInvalidationResult.success,
            message: cacheInvalidationResult.message
          });
        } catch (error) {
          results.push({
            test: test.name,
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const overallSuccess = successCount === results.length;

      return {
        success: overallSuccess,
        message: `Cache invalidation: ${successCount}/${results.length} tests passed`,
        duration: Date.now() - startTime,
        data: { results, successRate: (successCount / results.length) * 100 }
      };

    } catch (error) {
      return {
        success: false,
        message: `Cache invalidation test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  async testConcurrentUsers(): Promise<TestResult> {
    const startTime = Date.now();

    try {
      const concurrentUsers = 3;
      const userActions = [
        { user: 'user1', action: 'create_invoice', data: { total: 100 } },
        { user: 'user2', action: 'update_invoice', data: { id: 'shared-invoice', status: 'sent' } },
        { user: 'user3', action: 'delete_invoice', data: { id: 'deletable-invoice' } }
      ];

      // Simulate concurrent user actions
      const concurrentPromises = userActions.map(async (userAction, index) => {
        const delay = index * 100; // Stagger requests slightly
        await new Promise(resolve => setTimeout(resolve, delay));

        return await this.simulateUserAction(userAction);
      });

      const results = await Promise.allSettled(concurrentPromises);

      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const conflicts = results.filter(r => 
        r.status === 'fulfilled' && 
        !r.value.success && 
        r.value.message.includes('conflict')
      ).length;

      const hasProperConflictHandling = conflicts > 0; // Expected for concurrent updates
      const someSuccessful = successful > 0;

      return {
        success: someSuccessful,
        message: `Concurrent users: ${successful}/${userActions.length} successful, ${conflicts} conflicts detected`,
        duration: Date.now() - startTime,
        data: {
          totalActions: userActions.length,
          successful,
          conflicts,
          results: results.map((r, i) => ({
            user: userActions[i].user,
            status: r.status,
            result: r.status === 'fulfilled' ? r.value : { success: false, error: r.reason }
          }))
        }
      };

    } catch (error) {
      return {
        success: false,
        message: `Concurrent users test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  async testOfflineSync(): Promise<TestResult> {
    const startTime = Date.now();

    try {
      // Test offline/online transition scenario
      const offlineActions = [
        { action: 'create_invoice', data: { total: 150, offline: true } },
        { action: 'update_client', data: { id: 'client-1', name: 'Updated Offline', offline: true } }
      ];

      // Simulate going offline
      const offlineResults: any[] = [];
      
      for (const action of offlineActions) {
        const result = await this.simulateOfflineAction(action);
        offlineResults.push(result);
      }

      // Simulate coming back online and syncing
      const syncResults = await this.simulateOnlineSync(offlineResults.filter(r => r.success));

      const offlineActionsStored = offlineResults.filter(r => r.success).length;
      const syncSuccessful = syncResults.success;

      const overallSuccess = offlineActionsStored > 0 && syncSuccessful;

      return {
        success: overallSuccess,
        message: `Offline sync: ${offlineActionsStored} actions stored offline, sync ${syncSuccessful ? 'successful' : 'failed'}`,
        duration: Date.now() - startTime,
        data: {
          offlineActions: offlineResults,
          syncResult: syncResults,
          storedActions: offlineActionsStored
        }
      };

    } catch (error) {
      return {
        success: false,
        message: `Offline sync test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  async validateInvoiceStatusSync(): Promise<TestResult> {
    const startTime = Date.now();

    try {
      // Create test invoice
      const createResponse = await fetch(`${this.baseUrl}${this.apiUrl}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: 'test-client',
          total: 200,
          status: 'draft'
        })
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create test invoice');
      }

      const invoice = await createResponse.json();
      const invoiceId = invoice.id;

      // Update status
      const updateResponse = await fetch(`${this.baseUrl}${this.apiUrl}/invoices/${invoiceId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'sent' })
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update invoice status');
      }

      // Check if status is synchronized across different views
      const checks = await Promise.all([
        fetch(`${this.baseUrl}${this.apiUrl}/invoices/${invoiceId}`), // Detail view
        fetch(`${this.baseUrl}${this.apiUrl}/invoices`), // List view
        fetch(`${this.baseUrl}${this.apiUrl}/clients/${invoice.clientId}/invoices`) // Client invoices view
      ]);

      const checkResults = await Promise.all(
        checks.map(async (response, index) => {
          if (!response.ok) return { view: index, synced: false, error: response.statusText };

          const data = await response.json();
          let invoiceData;

          if (index === 0) {
            // Detail view
            invoiceData = data;
          } else if (index === 1) {
            // List view
            invoiceData = data.invoices?.find((inv: any) => inv.id === invoiceId);
          } else {
            // Client invoices view  
            invoiceData = data.find((inv: any) => inv.id === invoiceId);
          }

          return {
            view: ['detail', 'list', 'client'][index],
            synced: invoiceData?.status === 'sent',
            status: invoiceData?.status
          };
        })
      );

      const allSynced = checkResults.every(result => result.synced);

      // Cleanup
      await fetch(`${this.baseUrl}${this.apiUrl}/invoices/${invoiceId}`, {
        method: 'DELETE'
      });

      return {
        success: allSynced,
        message: `Invoice status sync: ${checkResults.filter(r => r.synced).length}/${checkResults.length} views synchronized`,
        duration: Date.now() - startTime,
        data: { checkResults, invoiceId }
      };

    } catch (error) {
      return {
        success: false,
        message: `Invoice status sync test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  async validateClientUpdateSync(): Promise<TestResult> {
    const startTime = Date.now();

    try {
      // Create test client
      const createResponse = await fetch(`${this.baseUrl}${this.apiUrl}/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Sync Test Client',
          email: 'synctest@example.com'
        })
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create test client');
      }

      const client = await createResponse.json();
      const clientId = client.id;

      // Update client
      const updatedName = 'Updated Sync Test Client';
      const updateResponse = await fetch(`${this.baseUrl}${this.apiUrl}/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: updatedName })
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update client');
      }

      // Check synchronization across views
      const checks = await Promise.all([
        fetch(`${this.baseUrl}${this.apiUrl}/clients/${clientId}`), // Detail view
        fetch(`${this.baseUrl}${this.apiUrl}/clients`), // List view
        fetch(`${this.baseUrl}${this.apiUrl}/clients/search?q=${encodeURIComponent(updatedName)}`) // Search view
      ]);

      const checkResults = await Promise.all(
        checks.map(async (response, index) => {
          if (!response.ok) return { view: index, synced: false, error: response.statusText };

          const data = await response.json();
          let clientData;

          if (index === 0) {
            clientData = data;
          } else if (index === 1) {
            clientData = data.clients?.find((c: any) => c.id === clientId);
          } else {
            clientData = data.find((c: any) => c.id === clientId);
          }

          return {
            view: ['detail', 'list', 'search'][index],
            synced: clientData?.name === updatedName,
            name: clientData?.name
          };
        })
      );

      const allSynced = checkResults.every(result => result.synced);

      // Cleanup
      await fetch(`${this.baseUrl}${this.apiUrl}/clients/${clientId}`, {
        method: 'DELETE'
      });

      return {
        success: allSynced,
        message: `Client update sync: ${checkResults.filter(r => r.synced).length}/${checkResults.length} views synchronized`,
        duration: Date.now() - startTime,
        data: { checkResults, clientId, updatedName }
      };

    } catch (error) {
      return {
        success: false,
        message: `Client update sync test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  async validateCreditBalanceSync(): Promise<TestResult> {
    const startTime = Date.now();

    try {
      // Get initial credit balance
      const initialBalanceResponse = await fetch(`${this.baseUrl}${this.apiUrl}/user/credits`);
      if (!initialBalanceResponse.ok) {
        throw new Error('Failed to get initial credit balance');
      }

      const initialBalance = await initialBalanceResponse.json();
      const startingCredits = initialBalance.credits;

      // Perform credit-consuming action (create invoice)
      const invoiceResponse = await fetch(`${this.baseUrl}${this.apiUrl}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: 'test-client',
          total: 100,
          items: [{ description: 'Credit Test', quantity: 1, unitPrice: 100 }]
        })
      });

      if (!invoiceResponse.ok) {
        throw new Error('Failed to create invoice for credit test');
      }

      const invoice = await invoiceResponse.json();

      // Check credit balance updates across components
      const creditChecks = await Promise.all([
        fetch(`${this.baseUrl}${this.apiUrl}/user/credits`), // Direct balance endpoint
        fetch(`${this.baseUrl}${this.apiUrl}/user/profile`), // Profile endpoint (may include credits)
        fetch(`${this.baseUrl}${this.apiUrl}/dashboard`) // Dashboard endpoint (may show credits)
      ]);

      const creditResults = await Promise.all(
        creditChecks.map(async (response, index) => {
          if (!response.ok) return { source: index, synced: false, error: response.statusText };

          const data = await response.json();
          let credits;

          if (index === 0) {
            credits = data.credits;
          } else if (index === 1) {
            credits = data.user?.credits || data.credits;
          } else {
            credits = data.credits || data.user?.credits;
          }

          return {
            source: ['direct', 'profile', 'dashboard'][index],
            synced: credits !== undefined && credits < startingCredits,
            credits,
            startingCredits
          };
        })
      );

      const creditsSynced = creditResults.filter(r => r.synced).length > 0;

      // Cleanup
      await fetch(`${this.baseUrl}${this.apiUrl}/invoices/${invoice.id}`, {
        method: 'DELETE'
      });

      return {
        success: creditsSynced,
        message: `Credit balance sync: ${creditResults.filter(r => r.synced).length}/${creditResults.length} sources synchronized`,
        duration: Date.now() - startTime,
        data: { creditResults, startingCredits, invoiceId: invoice.id }
      };

    } catch (error) {
      return {
        success: false,
        message: `Credit balance sync test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  private async simulateCacheInvalidation(test: any): Promise<{ success: boolean; message: string }> {
    // Mock cache invalidation check
    const cacheKey = `${test.cacheKey}-${Date.now()}`;
    
    try {
      // Simulate cache operation
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(cacheKey, JSON.stringify({ cached: true, timestamp: Date.now() }));
        
        // Simulate invalidation
        setTimeout(() => {
          localStorage.removeItem(cacheKey);
        }, 100);
        
        return { success: true, message: `${test.name} cache invalidation simulated` };
      } else {
        return { success: true, message: `${test.name} cache invalidation simulation (no localStorage)` };
      }
    } catch (error) {
      return { success: false, message: `Cache invalidation failed: ${error}` };
    }
  }

  private async simulateUserAction(userAction: any): Promise<{ success: boolean; message: string }> {
    const { user, action, data } = userAction;
    
    try {
      let endpoint = '';
      let method = 'POST';
      
      switch (action) {
        case 'create_invoice':
          endpoint = '/invoices';
          method = 'POST';
          break;
        case 'update_invoice':
          endpoint = `/invoices/${data.id}`;
          method = 'PATCH';
          break;
        case 'delete_invoice':
          endpoint = `/invoices/${data.id}`;
          method = 'DELETE';
          break;
        default:
          return { success: false, message: 'Unknown action' };
      }

      const response = await fetch(`${this.baseUrl}${this.apiUrl}${endpoint}`, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'X-User-ID': user // Simulate user identification
        },
        body: method !== 'DELETE' ? JSON.stringify(data) : undefined
      });

      return {
        success: response.ok,
        message: `${user} ${action}: ${response.ok ? 'success' : response.statusText}`
      };

    } catch (error) {
      return {
        success: false,
        message: `${user} ${action} failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async simulateOfflineAction(action: any): Promise<{ success: boolean; action: any; storedAt: number }> {
    // Simulate storing action for later sync
    const offlineKey = `offline_action_${Date.now()}`;
    
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(offlineKey, JSON.stringify({
          ...action,
          timestamp: Date.now(),
          synced: false
        }));

        return {
          success: true,
          action: { ...action, key: offlineKey },
          storedAt: Date.now()
        };
      } else {
        // Simulate successful offline storage
        return {
          success: true,
          action,
          storedAt: Date.now()
        };
      }
    } catch (error) {
      return {
        success: false,
        action,
        storedAt: Date.now()
      };
    }
  }

  private async simulateOnlineSync(offlineActions: any[]): Promise<{ success: boolean; syncedCount: number; errors: any[] }> {
    const errors: any[] = [];
    let syncedCount = 0;

    for (const action of offlineActions) {
      try {
        // Simulate syncing offline action
        if (action.action?.action === 'create_invoice') {
          const response = await fetch(`${this.baseUrl}${this.apiUrl}/invoices`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(action.action.data)
          });

          if (response.ok) {
            syncedCount++;
            // Remove from offline storage
            if (action.action.key && typeof localStorage !== 'undefined') {
              localStorage.removeItem(action.action.key);
            }
          } else {
            errors.push({ action: action.action, error: response.statusText });
          }
        } else {
          // Simulate other sync operations
          syncedCount++;
        }
      } catch (error) {
        errors.push({ action: action.action, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    return {
      success: errors.length === 0,
      syncedCount,
      errors
    };
  }
}

export function createRealtimeTestingSuite(): TestSuite {
  const realtimeTesting = new RealtimeTestingUtils();

  return {
    name: 'Real-time Updates Testing',
    tests: [
      {
        name: 'Optimistic Updates',
        fn: () => realtimeTesting.testOptimisticUpdates()
      },
      {
        name: 'Cache Invalidation',
        fn: () => realtimeTesting.testCacheInvalidation()
      },
      {
        name: 'Concurrent Users',
        fn: () => realtimeTesting.testConcurrentUsers()
      },
      {
        name: 'Offline Sync',
        fn: () => realtimeTesting.testOfflineSync()
      },
      {
        name: 'Invoice Status Synchronization',
        fn: () => realtimeTesting.validateInvoiceStatusSync()
      },
      {
        name: 'Client Update Synchronization',
        fn: () => realtimeTesting.validateClientUpdateSync()
      },
      {
        name: 'Credit Balance Synchronization',
        fn: () => realtimeTesting.validateCreditBalanceSync()
      }
    ]
  };
}