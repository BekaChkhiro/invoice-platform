import type { ServiceFormData } from '@/lib/validations/service'
import type { Service } from '@/types/database'

export interface ServiceWithStats extends Service {
  statistics: {
    times_used: number
    total_revenue: number
    average_price?: number
    unique_clients?: number
    recent_usage?: Array<{
      date: string
      amount: number
      quantity: number
      client_name: string
      invoice_status: string
    }>
  }
}

export interface ServiceListResponse {
  services: ServiceWithStats[]
  pagination: {
    total: number
    limit: number
    offset: number
    page: number
    totalPages: number
  }
}

export interface ServiceStatsResponse {
  services: ServiceWithStats[]
  summary: {
    total_services: number
    total_usage: number
    total_revenue: number
    average_price: number
    most_used_service: {
      id: string
      name: string
      usage_count: number
    } | null
    highest_revenue_service: {
      id: string
      name: string
      revenue: number
    } | null
  }
}

export interface ServiceFilter {
  search?: string
  status?: 'all' | 'active' | 'inactive'
  limit?: number
  offset?: number
  sort_by?: 'name' | 'default_price' | 'created_at'
  sort_order?: 'asc' | 'desc'
}

export const serviceService = {
  // Get services with statistics
  async getServices(filters?: ServiceFilter): Promise<ServiceListResponse> {
    const params = new URLSearchParams()
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== 'all') {
          params.append(key, String(value))
        }
      })
    }

    const response = await fetch(`/api/services?${params.toString()}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      let errorMessage = 'სერვისების მიღება ვერ მოხერხდა'
      try {
        const error = await response.json()
        errorMessage = error.error || errorMessage
      } catch {
        // If can't parse JSON, use default message
      }
      throw new Error(errorMessage)
    }
    return response.json()
  },

  // Get service statistics
  async getServiceStats(filters?: {
    date_from?: string
    date_to?: string
    service_ids?: string[]
    limit?: number
  }): Promise<ServiceStatsResponse> {
    const params = new URLSearchParams()
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== 'all') {
          if (Array.isArray(value)) {
            params.append(key, value.join(','))
          } else {
            params.append(key, String(value))
          }
        }
      })
    }

    const response = await fetch(`/api/services/stats?${params.toString()}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      let errorMessage = 'სტატისტიკის მიღება ვერ მოხერხდა'
      try {
        const error = await response.json()
        errorMessage = error.error || errorMessage
      } catch {
        // If can't parse JSON, use default message
      }
      throw new Error(errorMessage)
    }
    return response.json()
  },

  // Create service
  async createService(data: ServiceFormData): Promise<Service> {
    const response = await fetch('/api/services', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'სერვისის შექმნა ვერ მოხერხდა')
    }
    return response.json()
  },

  // Update service
  async updateService(id: string, data: Partial<ServiceFormData>): Promise<Service> {
    const response = await fetch(`/api/services/${id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'სერვისის განახლება ვერ მოხერხდა')
    }
    return response.json()
  },

  // Delete service
  async deleteService(id: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`/api/services/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'სერვისის წაშლა ვერ მოხერხდა')
    }
    return response.json()
  },

  // Toggle service status
  async toggleServiceStatus(id: string, is_active: boolean): Promise<Service> {
    const response = await fetch(`/api/services/${id}/toggle-status`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'სტატუსის განახლება ვერ მოხერხდა')
    }
    return response.json()
  }
}