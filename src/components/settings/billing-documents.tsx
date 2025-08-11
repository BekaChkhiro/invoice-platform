"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { format, startOfYear, endOfYear, getYear } from "date-fns"
import { ka } from "date-fns/locale"
import { 
  FileText, 
  Download, 
  Mail, 
  Calendar, 
  Eye, 
  Search,
  Filter,
  Check,
  X,
  Archive,
  Receipt,
  FileSpreadsheet,
  ChevronDown,
  Loader2
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"

// Document types
interface BillingDocument {
  id: string
  type: 'invoice' | 'receipt' | 'tax_document' | 'statement'
  documentNumber: string
  date: string
  amount: number
  currency: string
  status: 'paid' | 'pending' | 'failed' | 'refunded'
  description: string
  downloadUrl?: string
  emailSent?: boolean
  createdAt: string
  metadata?: {
    planName?: string
    billingPeriod?: string
    taxRate?: number
    paymentMethod?: string
  }
}

// Document type configurations
const DOCUMENT_TYPES = {
  invoice: {
    label: 'ინვოისი',
    icon: FileText,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    borderColor: 'border-blue-200 dark:border-blue-900'
  },
  receipt: {
    label: 'ქვითარი',
    icon: Receipt,
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950',
    borderColor: 'border-green-200 dark:border-green-900'
  },
  tax_document: {
    label: 'საგადასახადო დოკუმენტი',
    icon: FileSpreadsheet,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-950',
    borderColor: 'border-orange-200 dark:border-orange-900'
  },
  statement: {
    label: 'ანგარიში',
    icon: Archive,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950',
    borderColor: 'border-purple-200 dark:border-purple-900'
  }
}

const STATUS_CONFIG = {
  paid: {
    label: 'გადახდილი',
    variant: 'default' as const,
    className: 'bg-green-500 hover:bg-green-600 text-white'
  },
  pending: {
    label: 'მუშავდება',
    variant: 'secondary' as const,
    className: 'bg-yellow-500 hover:bg-yellow-600 text-white'
  },
  failed: {
    label: 'წარუმატებელი',
    variant: 'destructive' as const,
    className: 'bg-red-500 hover:bg-red-600 text-white'
  },
  refunded: {
    label: 'დაბრუნებული',
    variant: 'outline' as const,
    className: 'text-muted-foreground'
  }
}

interface BillingDocumentsProps {
  userId: string
  className?: string
}

export function BillingDocuments({ userId, className }: BillingDocumentsProps) {
  const [selectedDocuments, setSelectedDocuments] = React.useState<string[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedYear, setSelectedYear] = React.useState<string>(getYear(new Date()).toString())
  const [selectedType, setSelectedType] = React.useState<string>("all")
  const [selectedStatus, setSelectedStatus] = React.useState<string>("all")

  // Mock data - replace with actual API call
  const { data: documents, isLoading, error } = useQuery({
    queryKey: ['billing-documents', userId, selectedYear, selectedType, selectedStatus],
    queryFn: async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock billing documents
      const mockDocuments: BillingDocument[] = [
        {
          id: '1',
          type: 'invoice',
          documentNumber: 'INV-2024-001',
          date: '2024-01-15',
          amount: 29.00,
          currency: '₾',
          status: 'paid',
          description: 'ძირითადი გეგმა - იანვარი 2024',
          downloadUrl: '#',
          emailSent: true,
          createdAt: '2024-01-15T10:30:00Z',
          metadata: {
            planName: 'ძირითადი გეგმა',
            billingPeriod: 'იანვარი 2024',
            paymentMethod: 'ბარათი',
          }
        },
        {
          id: '2',
          type: 'receipt',
          documentNumber: 'RCP-2024-001',
          date: '2024-01-15',
          amount: 29.00,
          currency: '₾',
          status: 'paid',
          description: 'გადახდის ქვითარი - INV-2024-001',
          downloadUrl: '#',
          emailSent: false,
          createdAt: '2024-01-15T10:35:00Z',
          metadata: {
            planName: 'ძირითადი გეგმა',
            paymentMethod: 'ბარათი',
          }
        },
        {
          id: '3',
          type: 'tax_document',
          documentNumber: 'TAX-2024-Q1',
          date: '2024-03-31',
          amount: 87.00,
          currency: '₾',
          status: 'paid',
          description: 'Q1 2024 საგადასახადო ანგარიში',
          downloadUrl: '#',
          emailSent: true,
          createdAt: '2024-03-31T23:59:00Z',
          metadata: {
            billingPeriod: 'Q1 2024',
            taxRate: 18,
          }
        },
        {
          id: '4',
          type: 'statement',
          documentNumber: 'STMT-2024-001',
          date: '2024-01-31',
          amount: 29.00,
          currency: '₾',
          status: 'paid',
          description: 'იანვრის ანგარიში',
          downloadUrl: '#',
          emailSent: true,
          createdAt: '2024-01-31T23:59:00Z',
        }
      ]

      // Filter documents based on selected filters
      return mockDocuments.filter(doc => {
        const matchesSearch = doc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            doc.documentNumber.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesYear = getYear(new Date(doc.date)).toString() === selectedYear
        const matchesType = selectedType === 'all' || doc.type === selectedType
        const matchesStatus = selectedStatus === 'all' || doc.status === selectedStatus

        return matchesSearch && matchesYear && matchesType && matchesStatus
      })
    },
    staleTime: 5 * 60 * 1000,
  })

  // Available years for filtering
  const availableYears = React.useMemo(() => {
    const currentYear = getYear(new Date())
    return Array.from({ length: 5 }, (_, i) => currentYear - i)
  }, [])

  const handleSelectDocument = (documentId: string, checked: boolean) => {
    setSelectedDocuments(prev => 
      checked 
        ? [...prev, documentId]
        : prev.filter(id => id !== documentId)
    )
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked && documents) {
      setSelectedDocuments(documents.map(doc => doc.id))
    } else {
      setSelectedDocuments([])
    }
  }

  const handleDownload = async (documentId: string) => {
    const document = documents?.find(d => d.id === documentId)
    if (!document) return

    // Simulate download
    toast.success(`ჩამოიტვირთა: ${document.documentNumber}`)
  }

  const handleBulkDownload = async () => {
    if (selectedDocuments.length === 0) return
    
    toast.success(`ჩამოიტვირთა ${selectedDocuments.length} დოკუმენტი`)
    setSelectedDocuments([])
  }

  const handleEmailDocuments = async () => {
    if (selectedDocuments.length === 0) return
    
    toast.success(`გამოიგზავნა ${selectedDocuments.length} დოკუმენტი`)
    setSelectedDocuments([])
  }

  const formatCurrency = (amount: number, currency: string) => {
    return `${currency}${amount.toFixed(2)}`
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy', { locale: ka })
  }

  if (error) {
    return (
      <div className={cn("space-y-4", className)}>
        <Alert variant="destructive">
          <FileText className="h-4 w-4" />
          <AlertDescription>
            დოკუმენტების ჩატვირთვა ვერ მოხერხდა. გთხოვთ სცადოთ თავიდან.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">ბილინგის დოკუმენტები</h3>
          <p className="text-sm text-muted-foreground">
            ინვოისები, ქვითრები და საგადასახადო დოკუმენტები
          </p>
        </div>
        
        {selectedDocuments.length > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              არჩეული: {selectedDocuments.length}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkDownload}
            >
              <Download className="h-4 w-4 mr-2" />
              ჩამოტვირთვა
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleEmailDocuments}
            >
              <Mail className="h-4 w-4 mr-2" />
              ელ.ფოსტა
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid gap-4 md:grid-cols-5">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ძებნა დოკუმენტის ნომრით ან აღწერით..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue placeholder="წელი" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="ტიპი" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ყველა ტიპი</SelectItem>
                {Object.entries(DOCUMENT_TYPES).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="სტატუსი" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ყველა სტატუსი</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            დოკუმენტები ({documents?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-6 w-6" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-8 w-8" />
                </div>
              ))}
            </div>
          ) : !documents || documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold mb-2">დოკუმენტები არ მოიძებნა</h3>
              <p className="text-sm text-muted-foreground text-center">
                {searchQuery || selectedType !== 'all' || selectedStatus !== 'all'
                  ? 'მოცემული ფილტრებით დოკუმენტები არ მოიძებნა'
                  : 'ბილინგის დოკუმენტები გამოჩნდება აქ'
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedDocuments.length === documents.length && documents.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>ტიპი</TableHead>
                  <TableHead>ნომერი</TableHead>
                  <TableHead>აღწერა</TableHead>
                  <TableHead>თარიღი</TableHead>
                  <TableHead className="text-right">თანხა</TableHead>
                  <TableHead>სტატუსი</TableHead>
                  <TableHead className="text-center">ქმედებები</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((document) => {
                  const typeConfig = DOCUMENT_TYPES[document.type]
                  const statusConfig = STATUS_CONFIG[document.status]
                  const TypeIcon = typeConfig.icon

                  return (
                    <TableRow key={document.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedDocuments.includes(document.id)}
                          onCheckedChange={(checked) => 
                            handleSelectDocument(document.id, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "p-2 rounded-lg",
                            typeConfig.bgColor,
                            typeConfig.borderColor,
                            "border"
                          )}>
                            <TypeIcon className={cn("h-4 w-4", typeConfig.color)} />
                          </div>
                          <span className="text-sm font-medium">
                            {typeConfig.label}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {document.documentNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{document.description}</p>
                          {document.metadata?.planName && (
                            <p className="text-sm text-muted-foreground">
                              {document.metadata.planName}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(document.date)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(document.amount, document.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={statusConfig.variant}
                          className={statusConfig.className}
                        >
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>ქმედებები</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDownload(document.id)}>
                              <Download className="h-4 w-4 mr-2" />
                              ჩამოტვირთვა
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              ნახვა
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="h-4 w-4 mr-2" />
                              ელ.ფოსტით გაგზავნა
                            </DropdownMenuItem>
                            {document.status === 'paid' && (
                              <DropdownMenuItem>
                                <Receipt className="h-4 w-4 mr-2" />
                                ქვითარი
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Document Summary */}
      {documents && documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>დოკუმენტების შეჯამება</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              {Object.entries(DOCUMENT_TYPES).map(([type, config]) => {
                const count = documents.filter(d => d.type === type).length
                const total = documents
                  .filter(d => d.type === type)
                  .reduce((sum, d) => sum + d.amount, 0)

                return (
                  <div key={type} className="text-center">
                    <div className={cn(
                      "mx-auto w-12 h-12 rounded-lg flex items-center justify-center mb-2",
                      config.bgColor,
                      config.borderColor,
                      "border"
                    )}>
                      <config.icon className={cn("h-6 w-6", config.color)} />
                    </div>
                    <p className="font-semibold">{count}</p>
                    <p className="text-sm text-muted-foreground">{config.label}</p>
                    {total > 0 && (
                      <p className="text-xs text-muted-foreground">
                        ₾{total.toFixed(2)}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Loading skeleton
export function BillingDocumentsSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid gap-4 md:grid-cols-5">
            <div className="md:col-span-2">
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-3 p-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-10 w-10" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}