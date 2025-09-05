'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Wrench, Search, Edit, Trash2, Eye, EyeOff, BarChart3, RefreshCcw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Service } from '@/types/database'
import { ServiceFormData } from '@/lib/validations/service'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/use-auth'
import { useServiceList, useCreateService, useUpdateService, useServiceOperations } from '@/lib/hooks/use-services'
import { toast } from 'sonner'


export default function ServicesPage() {
  const { company, isAuthenticated, loading: authLoading } = useAuth()
  
  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  
  // Form data for creating/editing services
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    description: '',
    default_price: 0,
    unit: 'ერთეული',
    is_active: true
  })

  // Use the service list hook
  const {
    services,
    pagination,
    stats,
    isLoading,
    statsLoading,
    error,
    filters,
    updateFilters,
    resetFilters,
    currentPage,
    totalPages,
    goToPage,
    goToPrevious,
    goToNext,
    toggleSort,
    selectedServices,
    toggleServiceSelection,
    toggleAllServices,
    clearSelection,
    isAllSelected,
    hasSelection,
    refetch
  } = useServiceList()

  // Mutation hooks
  const createService = useCreateService()
  const updateService = useUpdateService()
  const { toggleStatus, deleteService } = useServiceOperations()

  // This state was already declared earlier in the component

  // Don't render if not authenticated
  if (!isAuthenticated || authLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-full mb-4" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingService) {
      // Update existing service
      updateService.mutate(
        { id: editingService.id, data: formData },
        {
          onSuccess: () => {
            setIsEditDialogOpen(false)
            setEditingService(null)
            resetForm()
          }
        }
      )
    } else {
      // Create new service
      createService.mutate(formData, {
        onSuccess: () => {
          setIsCreateDialogOpen(false)
          resetForm()
        }
      })
    }
  }

  const handleToggleStatus = (serviceId: string, currentStatus: boolean) => {
    toggleStatus.mutate({
      id: serviceId,
      is_active: !currentStatus
    })
  }

  const handleDeleteService = (serviceId: string) => {
    if (!confirm('დარწმუნებული ხართ რომ გსურთ სერვისის წაშლა?')) {
      return
    }
    deleteService.mutate(serviceId)
  }

  const openEditDialog = (service: Service) => {
    setEditingService(service)
    setFormData({
      name: service.name,
      description: service.description || '',
      default_price: service.default_price || 0,
      unit: service.unit || 'ერთეული',
      is_active: service.is_active
    })
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      default_price: 0,
      unit: 'ერთეული',
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
          <Link href="/dashboard/services/analytics">
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
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
          />
        </div>
        <Select value={filters.status} onValueChange={(value: any) => updateFilters({ status: value })}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="სტატუსის ფილტრი" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ყველა სერვისი</SelectItem>
            <SelectItem value="active">აქტიური</SelectItem>
            <SelectItem value="inactive">გაუქმებული</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          განახლება
        </Button>
      </div>

      {error && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2 text-red-600">შეცდომა მოხდა</h3>
              <p className="text-muted-foreground mb-4">
                {error instanceof Error ? error.message : 'სერვისების ჩატვირთვა ვერ მოხერხდა'}
              </p>
              <Button onClick={() => refetch()} variant="outline">
                <RefreshCcw className="w-4 h-4 mr-2" />
                თავიდან სცადეთ
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <div className="flex justify-between pt-2">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : services.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wrench className="h-12 w-12 text-gray-400 mb-4" />
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
                          onClick={() => handleToggleStatus(service.id, service.is_active)}
                          disabled={toggleStatus.isPending}
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
                          onClick={() => handleDeleteService(service.id)}
                          disabled={deleteService.isPending}
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

          {pagination && pagination.totalPages > 1 && (
            <Card>
              <CardContent className="py-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>
                      გვერდი {currentPage} {totalPages}-დან
                    </span>
                    <Badge variant="outline" className="px-2 py-1">
                      სულ: {pagination.total}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToPrevious}
                      disabled={currentPage <= 1}
                    >
                      წინა
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNumber: number
                        
                        if (totalPages <= 5) {
                          pageNumber = i + 1
                        } else {
                          const start = Math.max(1, currentPage - 2)
                          const end = Math.min(totalPages, start + 4)
                          pageNumber = start + i
                          
                          if (pageNumber > end) return null
                        }
                        
                        return (
                          <Button
                            key={pageNumber}
                            variant={pageNumber === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => goToPage(pageNumber)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNumber}
                          </Button>
                        )
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToNext}
                      disabled={currentPage >= totalPages}
                    >
                      შემდეგი
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
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
                    value={formData.default_price}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      default_price: e.target.value ? parseFloat(e.target.value) : 0
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
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={createService.isPending}
              >
                გაუქმება
              </Button>
              <Button 
                type="submit"
                disabled={createService.isPending}
              >
                {createService.isPending ? 'შენახვა...' : 'შენახვა'}
              </Button>
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
                    value={formData.default_price}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      default_price: e.target.value ? parseFloat(e.target.value) : 0
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
                      <SelectItem value="ერთეული">ერთეული</SelectItem>
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
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
                disabled={updateService.isPending}
              >
                გაუქმება
              </Button>
              <Button 
                type="submit"
                disabled={updateService.isPending}
              >
                {updateService.isPending ? 'განახლება...' : 'განახლება'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}