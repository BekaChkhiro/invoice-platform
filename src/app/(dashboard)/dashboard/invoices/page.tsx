'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Download, MoreHorizontal, RefreshCcw } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

import { useInvoiceList } from '@/lib/hooks/use-invoice-list'
import { useInvoiceRealtime } from '@/lib/hooks/use-invoice-realtime'
import { useAuth } from '@/lib/hooks/use-auth'
import { InvoiceStatsCards } from '@/components/invoices/invoice-stats-cards'
import { InvoiceFilters } from '@/components/invoices/invoice-filters'
import { InvoiceTable } from '@/components/invoices/invoice-table'
import { BulkActions } from '@/components/invoices/bulk-actions'

export default function InvoicesPage() {
  const { company } = useAuth()
  
  // Enable real-time subscriptions for invoices
  useInvoiceRealtime(company?.id)
  
  const {
    // Data
    invoices,
    pagination,
    stats,
    isLoading,
    statsLoading,
    error,
    
    // Filters
    filters,
    updateFilters,
    resetFilters,
    quickFilters,
    
    // Pagination
    currentPage,
    totalPages,
    goToPage,
    goToPrevious,
    goToNext,
    
    // Sorting
    toggleSort,
    
    // Selection
    selectedInvoices,
    toggleInvoiceSelection,
    toggleAllInvoices,
    clearSelection,
    isAllSelected,
    hasSelection,
    
    // Actions
    refetch,
    exportInvoices
  } = useInvoiceList()

  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await refetch()
    } finally {
      setIsRefreshing(false)
    }
  }, [refetch])

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    await exportInvoices(format, false)
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + R for refresh
      if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
        event.preventDefault()
        handleRefresh()
      }
      
      // Ctrl/Cmd + A for select all
      if ((event.ctrlKey || event.metaKey) && event.key === 'a' && !isLoading) {
        event.preventDefault()
        toggleAllInvoices()
      }
      
      // Escape to clear selection
      if (event.key === 'Escape' && hasSelection) {
        clearSelection()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleRefresh, toggleAllInvoices, clearSelection, hasSelection, isLoading])

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2 text-red-600">შეცდომა მოხდა</h3>
              <p className="text-muted-foreground mb-4">
                {error instanceof Error ? error.message : 'ინვოისების ჩატვირთვა ვერ მოხერხდა'}
              </p>
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCcw className="w-4 h-4 mr-2" />
                თავიდან სცადეთ
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ინვოისები</h1>
          <p className="text-muted-foreground">
            მართეთ თქვენი ინვოისები და გააკონტროლეთ გადახდები
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            განახლება
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                ექსპორტი
                <MoreHorizontal className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                CSV ფორმატი
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('excel')}>
                Excel ფორმატი
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                PDF ფორმატი
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button asChild>
            <Link href="/dashboard/invoices/new">
              <Plus className="w-4 h-4 mr-2" />
              ახალი ინვოისი
            </Link>
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <InvoiceStatsCards stats={stats} isLoading={statsLoading} />

      {/* Bulk Actions */}
      {hasSelection && (
        <BulkActions
          selectedInvoices={selectedInvoices}
          onClearSelection={clearSelection}
          onRefresh={refetch}
        />
      )}

      {/* Filters */}
      <InvoiceFilters
        filters={filters}
        onFiltersChange={updateFilters}
        onReset={resetFilters}
        quickFilters={quickFilters}
      />

      {/* Table */}
      <InvoiceTable
        invoices={invoices}
        isLoading={isLoading}
        selectedInvoices={selectedInvoices}
        onToggleInvoice={toggleInvoiceSelection}
        onToggleAll={toggleAllInvoices}
        isAllSelected={isAllSelected}
        filters={filters}
        onSort={toggleSort}
      />

      {/* Pagination */}
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

      {/* Mobile-specific optimizations */}
      <div className="sm:hidden">
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Help text */}
      {!isLoading && invoices.length > 0 && (
        <Card className="border-dashed">
          <CardContent className="py-4">
            <div className="text-center text-sm text-muted-foreground">
              <p className="mb-2">
                💡 <strong>მალსახმობი კლავიშები:</strong> Ctrl+R განახლება, Ctrl+A ყველას მონიშვნა, Esc მონიშვნის გასუფთავება
              </p>
              <p>
                გამოიყენეთ ფილტრები და ძიება სასურველი ინვოისების სწრაფად საპოვნელად
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}