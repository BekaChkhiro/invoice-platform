'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Settings, Search, Edit, Trash2, Eye, EyeOff, BarChart3 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Service, NewService } from '@/types/database'
import Link from 'next/link'

interface ServiceWithStats extends Service {
  statistics: {
    times_used: number
    total_revenue: number
  }
}

interface ServicesResponse {
  services: ServiceWithStats[]
  pagination: {
    total: number
    limit: number
    offset: number
    page: number
    totalPages: number
  }
}

export default function ServicesPage() {
  const { toast } = useToast()
  const [services, setServices] = useState<ServiceWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<ServiceWithStats | null>(null)
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    totalPages: 1,
    limit: 10
  })

  const [formData, setFormData] = useState<NewService>({
    name: '',
    description: '',
    default_price: undefined,
    unit: 'ცალი',
    company_id: '', // Will be set by backend
    is_active: true
  })

  useEffect(() => {
    fetchServices()
  }, [searchTerm, statusFilter, pagination.page])

  const fetchServices = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        search: searchTerm,
        status: statusFilter,
        limit: pagination.limit.toString(),
        offset: ((pagination.page - 1) * pagination.limit).toString()
      })

      const response = await fetch(`/api/services?${params}`)
      if (!response.ok) throw new Error('Failed to fetch services')

      const data: ServicesResponse = await response.json()
      setServices(data.services)
      setPagination(prev => ({
        ...prev,
        total: data.pagination.total,
        totalPages: data.pagination.totalPages
      }))
    } catch (error) {
      console.error('Error fetching services:', error)
      toast({
        title: "შეცდომა",
        description: "სერვისების ჩატვირთვა ვერ მოხერხდა",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingService ? `/api/services/${editingService.id}` : '/api/services'
      const method = editingService ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save service')
      }

      toast({
        title: "წარმატება",
        description: editingService ? "სერვისი განახლდა" : "სერვისი შეიქმნა"
      })

      setIsCreateDialogOpen(false)
      setIsEditDialogOpen(false)
      setEditingService(null)
      resetForm()
      fetchServices()
    } catch (error) {
      console.error('Error saving service:', error)
      toast({
        title: "შეცდომა",
        description: error instanceof Error ? error.message : "სერვისის შენახვა ვერ მოხერხდა",
        variant: "destructive"
      })
    }
  }

  const toggleServiceStatus = async (serviceId: string) => {
    try {
      const response = await fetch(`/api/services/${serviceId}/toggle-status`, {
        method: 'PATCH',
      })

      if (!response.ok) throw new Error('Failed to toggle service status')

      toast({
        title: "წარმატება",
        description: "სერვისის სტატუსი შეცვლილია"
      })

      fetchServices()
    } catch (error) {
      console.error('Error toggling service status:', error)
      toast({
        title: "შეცდომა",
        description: "სტატუსის შეცვლა ვერ მოხერხდა",
        variant: "destructive"
      })
    }
  }

  const deleteService = async (serviceId: string) => {
    if (!confirm('დარწმუნებული ხართ რომ გსურთ სერვისის წაშლა?')) {
      return
    }

    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete service')
      }

      toast({
        title: "წარმატება",
        description: "სერვისი წარმატებით წაიშალა"
      })

      fetchServices()
    } catch (error) {
      console.error('Error deleting service:', error)
      toast({
        title: "შეცდომა",
        description: error instanceof Error ? error.message : "სერვისის წაშლა ვერ მოხერხდა",
        variant: "destructive"
      })
    }
  }

  const openEditDialog = (service: ServiceWithStats) => {
    setEditingService(service)
    setFormData({
      name: service.name,
      description: service.description || '',
      default_price: service.default_price || undefined,
      unit: service.unit || 'ცალი',
      company_id: service.company_id,
      is_active: service.is_active
    })
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      default_price: undefined,
      unit: 'ცალი',
      company_id: '',
      is_active: true
    })
  }

  const openCreateDialog = () => {
    resetForm()
    setIsCreateDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">სერვისები</h1>
          <p className="text-gray-600">მართეთ თქვენი სერვისები</p>
        </div>
        <div className="flex space-x-2">
          <Link href="/working-dashboard/services/analytics">
            <Button variant="outline">
              <BarChart3 className="mr-2 h-4 w-4" />
              ანალიტიკა
            </Button>
          </Link>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            ახალი სერვისი
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="ძებნა სერვისებში..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="სტატუსის ფილტრი" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ყველა სერვისი</SelectItem>
            <SelectItem value="active">აქტიური</SelectItem>
            <SelectItem value="inactive">გაუქმებული</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : services.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Settings className="h-12 w-12 text-gray-400 mb-4" />
            <CardTitle className="text-xl mb-2">არ გაქვთ სერვისები</CardTitle>
            <CardDescription className="text-center mb-4">
              დაამატეთ თქვენი პირველი სერვისი
            </CardDescription>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              დამატება
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <Card key={service.id} className={`transition-opacity ${!service.is_active ? 'opacity-60' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant={service.is_active ? "default" : "secondary"}>
                        {service.is_active ? "აქტიური" : "გაუქმებული"}
                      </Badge>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleServiceStatus(service.id)}
                        >
                          {service.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(service)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteService(service.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  {service.description && (
                    <CardDescription>{service.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>ფასი:</span>
                      <span className="font-medium">
                        {service.default_price ? `${service.default_price} ₾` : 'განსაზღვრული არ არის'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>ერთეული:</span>
                      <span className="font-medium">{service.unit}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>გამოყენებული:</span>
                      <span className="font-medium">{service.statistics.times_used} ჯერ</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>შემოსავალი:</span>
                      <span className="font-medium">{service.statistics.total_revenue} ₾</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex justify-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page <= 1}
              >
                წინა
              </Button>
              <span className="px-4 py-2 text-sm">
                გვერდი {pagination.page} / {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= pagination.totalPages}
              >
                შემდეგი
              </Button>
            </div>
          )}
        </>
      )}

      {/* Create Service Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ახალი სერვისი</DialogTitle>
            <DialogDescription>
              შეავსეთ სერვისის ინფორმაცია
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">სერვისის სახელი *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="მაგ: ვებ-გვერდის შექმნა"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">აღწერა</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="სერვისის დეტალური აღწერა..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">საწყისი ფასი (₾)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.default_price || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      default_price: e.target.value ? parseFloat(e.target.value) : undefined 
                    }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="unit">საზომი ერთეული</Label>
                  <Select value={formData.unit} onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ცალი">ცალი</SelectItem>
                      <SelectItem value="საათი">საათი</SelectItem>
                      <SelectItem value="დღე">დღე</SelectItem>
                      <SelectItem value="კვირა">კვირა</SelectItem>
                      <SelectItem value="თვე">თვე</SelectItem>
                      <SelectItem value="კვ.მ">კვ.მ</SelectItem>
                      <SelectItem value="მ">მ</SelectItem>
                      <SelectItem value="კგ">კგ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                გაუქმება
              </Button>
              <Button type="submit">შენახვა</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Service Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>სერვისის რედაქტირება</DialogTitle>
            <DialogDescription>
              შეცვალეთ სერვისის ინფორმაცია
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">სერვისის სახელი *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="მაგ: ვებ-გვერდის შექმნა"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-description">აღწერა</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="სერვისის დეტალური აღწერა..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-price">საწყისი ფასი (₾)</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.default_price || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      default_price: e.target.value ? parseFloat(e.target.value) : undefined 
                    }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-unit">საზომი ერთეული</Label>
                  <Select value={formData.unit} onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ცალი">ცალი</SelectItem>
                      <SelectItem value="საათი">საათი</SelectItem>
                      <SelectItem value="დღე">დღე</SelectItem>
                      <SelectItem value="კვირა">კვირა</SelectItem>
                      <SelectItem value="თვე">თვე</SelectItem>
                      <SelectItem value="კვ.მ">კვ.მ</SelectItem>
                      <SelectItem value="მ">მ</SelectItem>
                      <SelectItem value="კგ">კგ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                გაუქმება
              </Button>
              <Button type="submit">განახლება</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}