"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { 
  CreditCard, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  Star,
  Building,
  MapPin,
  Shield,
  AlertCircle
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Payment method types
interface PaymentMethod {
  id: string
  type: 'card' | 'bank' | 'paypal'
  isDefault: boolean
  cardDetails?: {
    last4: string
    brand: string
    expMonth: number
    expYear: number
    holderName: string
  }
  bankDetails?: {
    accountNumber: string
    routingNumber: string
    bankName: string
    accountType: string
  }
  paypalDetails?: {
    email: string
  }
  billingAddress?: {
    line1: string
    line2?: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  createdAt: string
}

// Form schemas
const cardFormSchema = z.object({
  cardNumber: z.string().regex(/^\d{13,19}$/, "არასწორი ბარათის ნომერი"),
  expiryMonth: z.string().min(1, "აირჩიეთ თვე"),
  expiryYear: z.string().min(1, "აირჩიეთ წელი"),
  cvv: z.string().regex(/^\d{3,4}$/, "არასწორი CVV"),
  holderName: z.string().min(2, "მფლობელის სახელი სავალდებულოა"),
  billingLine1: z.string().min(1, "მისამართი სავალდებულოა"),
  billingLine2: z.string().optional(),
  billingCity: z.string().min(1, "ქალაქი სავალდებულოა"),
  billingState: z.string().min(1, "რეგიონი სავალდებულოა"),
  billingPostalCode: z.string().min(1, "საფოსტო კოდი სავალდებულოა"),
  billingCountry: z.string().min(1, "ქვეყანა სავალდებულოა"),
})

const bankFormSchema = z.object({
  accountNumber: z.string().min(8, "არასწორი ანგარიშის ნომერი"),
  routingNumber: z.string().min(8, "არასწორი routing ნომერი"),
  accountHolderName: z.string().min(2, "მფლობელის სახელი სავალდებულოა"),
  bankName: z.string().min(2, "ბანკის სახელი სავალდებულოა"),
  accountType: z.enum(['checking', 'savings']),
})

const paypalFormSchema = z.object({
  email: z.string().email("არასწორი ელ.ფოსტის ფორმატი"),
})

interface PaymentMethodsProps {
  userId: string
  className?: string
}

export function PaymentMethods({ userId, className }: PaymentMethodsProps) {
  const [paymentMethods, setPaymentMethods] = React.useState<PaymentMethod[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isAddingMethod, setIsAddingMethod] = React.useState(false)
  const [selectedMethodType, setSelectedMethodType] = React.useState<'card' | 'bank' | 'paypal'>('card')

  // Mock data - replace with actual API calls
  React.useEffect(() => {
    const loadPaymentMethods = async () => {
      setIsLoading(true)
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock payment methods
      setPaymentMethods([
        {
          id: '1',
          type: 'card',
          isDefault: true,
          cardDetails: {
            last4: '4242',
            brand: 'Visa',
            expMonth: 12,
            expYear: 2025,
            holderName: 'John Doe'
          },
          billingAddress: {
            line1: 'თბილისი, რუსთაველის 45',
            city: 'თბილისი',
            state: 'თბილისი',
            postalCode: '0108',
            country: 'GE'
          },
          createdAt: '2025-01-15'
        },
        {
          id: '2',
          type: 'paypal',
          isDefault: false,
          paypalDetails: {
            email: 'user@example.com'
          },
          createdAt: '2025-02-10'
        }
      ])
      setIsLoading(false)
    }

    loadPaymentMethods()
  }, [userId])

  const handleSetDefault = async (methodId: string) => {
    setPaymentMethods(prev => prev.map(method => ({
      ...method,
      isDefault: method.id === methodId
    })))
    toast.success('ძირითადი გადახდის მეთოდი შეიცვალა')
  }

  const handleDeleteMethod = async (methodId: string) => {
    setPaymentMethods(prev => prev.filter(method => method.id !== methodId))
    toast.success('გადახდის მეთოდი წაიშალა')
  }

  const getBrandIcon = (brand: string) => {
    // You could add actual brand icons here
    return <CreditCard className="h-6 w-6" />
  }

  const formatCardNumber = (last4: string) => `•••• •••• •••• ${last4}`

  if (isLoading) {
    return <PaymentMethodsSkeleton className={className} />
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">გადახდის მეთოდები</h3>
          <p className="text-sm text-muted-foreground">
            მართეთ თქვენი გადახდის მეთოდები და ბილინგის მისამართები
          </p>
        </div>
        <Dialog open={isAddingMethod} onOpenChange={setIsAddingMethod}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              მეთოდის დამატება
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>გადახდის მეთოდის დამატება</DialogTitle>
              <DialogDescription>
                აირჩიეთ გადახდის მეთოდის ტიპი და შეავსეთ საჭირო ინფორმაცია
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant={selectedMethodType === 'card' ? 'default' : 'outline'}
                  className="h-20 flex-col"
                  onClick={() => setSelectedMethodType('card')}
                >
                  <CreditCard className="h-6 w-6 mb-1" />
                  <span className="text-xs">ბარათი</span>
                </Button>
                <Button
                  variant={selectedMethodType === 'bank' ? 'default' : 'outline'}
                  className="h-20 flex-col"
                  onClick={() => setSelectedMethodType('bank')}
                >
                  <Building className="h-6 w-6 mb-1" />
                  <span className="text-xs">საბანკო ანგარიში</span>
                </Button>
                <Button
                  variant={selectedMethodType === 'paypal' ? 'default' : 'outline'}
                  className="h-20 flex-col"
                  onClick={() => setSelectedMethodType('paypal')}
                >
                  <Shield className="h-6 w-6 mb-1" />
                  <span className="text-xs">PayPal</span>
                </Button>
              </div>

              {selectedMethodType === 'card' && <AddCardForm onClose={() => setIsAddingMethod(false)} />}
              {selectedMethodType === 'bank' && <AddBankForm onClose={() => setIsAddingMethod(false)} />}
              {selectedMethodType === 'paypal' && <AddPayPalForm onClose={() => setIsAddingMethod(false)} />}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {paymentMethods.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold mb-2">გადახდის მეთოდები არ არის</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              დაამატეთ ბარათი ან საბანკო ანგარიში გადახდებისთვის
            </p>
            <Button onClick={() => setIsAddingMethod(true)}>
              <Plus className="h-4 w-4 mr-2" />
              პირველი მეთოდის დამატება
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {paymentMethods.map((method) => (
            <Card key={method.id} className={cn(
              "relative",
              method.isDefault && "border-primary ring-2 ring-primary/20"
            )}>
              {method.isDefault && (
                <Badge className="absolute -top-2 -right-2 bg-primary">
                  <Star className="h-3 w-3 mr-1" />
                  ძირითადი
                </Badge>
              )}
              
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {method.type === 'card' && method.cardDetails && (
                      <>
                        {getBrandIcon(method.cardDetails.brand)}
                        <div>
                          <p className="font-medium">
                            {formatCardNumber(method.cardDetails.last4)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {method.cardDetails.brand} • {method.cardDetails.expMonth.toString().padStart(2, '0')}/{method.cardDetails.expYear}
                          </p>
                        </div>
                      </>
                    )}
                    
                    {method.type === 'bank' && method.bankDetails && (
                      <>
                        <Building className="h-6 w-6" />
                        <div>
                          <p className="font-medium">{method.bankDetails.bankName}</p>
                          <p className="text-sm text-muted-foreground">
                            •••• {method.bankDetails.accountNumber.slice(-4)}
                          </p>
                        </div>
                      </>
                    )}
                    
                    {method.type === 'paypal' && method.paypalDetails && (
                      <>
                        <Shield className="h-6 w-6" />
                        <div>
                          <p className="font-medium">PayPal</p>
                          <p className="text-sm text-muted-foreground">
                            {method.paypalDetails.email}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {}}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteMethod(method.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                {method.cardDetails && method.billingAddress && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      ბილინგის მისამართი
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {method.billingAddress.line1}
                      {method.billingAddress.line2 && `, ${method.billingAddress.line2}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {method.billingAddress.city}, {method.billingAddress.postalCode}
                    </p>
                  </div>
                )}
                
                <div className="flex items-center gap-2 mt-4">
                  {!method.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(method.id)}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      ძირითადად დაყენება
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// Add Card Form Component
function AddCardForm({ onClose }: { onClose: () => void }) {
  const form = useForm<z.infer<typeof cardFormSchema>>({
    resolver: zodResolver(cardFormSchema),
    defaultValues: {
      cardNumber: "",
      expiryMonth: "",
      expiryYear: "",
      cvv: "",
      holderName: "",
      billingLine1: "",
      billingLine2: "",
      billingCity: "",
      billingState: "",
      billingPostalCode: "",
      billingCountry: "GE",
    },
  })

  const onSubmit = async (values: z.infer<typeof cardFormSchema>) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('ბარათი წარმატებით დაემატა')
      onClose()
    } catch (error) {
      toast.error('დაფიქსირდა შეცდომა')
    }
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 20 }, (_, i) => currentYear + i)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            თქვენი გადახდის ინფორმაცია უსაფრთხოა და დაშიფრული ფორმით იქება
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="cardNumber"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>ბარათის ნომერი</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="1234 5678 9012 3456" 
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '')
                      field.onChange(value)
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="expiryMonth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>თვე</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="თვე" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month} value={month.toString()}>
                        {month.toString().padStart(2, '0')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="expiryYear"
            render={({ field }) => (
              <FormItem>
                <FormLabel>წელი</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="წელი" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cvv"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CVV</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="123" 
                    maxLength={4}
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '')
                      field.onChange(value)
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="holderName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>მფლობელის სახელი</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <h4 className="font-medium">ბილინგის მისამართი</h4>
          
          <FormField
            control={form.control}
            name="billingLine1"
            render={({ field }) => (
              <FormItem>
                <FormLabel>მისამართი</FormLabel>
                <FormControl>
                  <Input placeholder="რუსთაველის 45" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="billingLine2"
            render={({ field }) => (
              <FormItem>
                <FormLabel>მისამართი 2 (არასავალდებულო)</FormLabel>
                <FormControl>
                  <Input placeholder="ბ. 10" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="billingCity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ქალაქი</FormLabel>
                  <FormControl>
                    <Input placeholder="თბილისი" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="billingState"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>რეგიონი</FormLabel>
                  <FormControl>
                    <Input placeholder="თბილისი" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="billingPostalCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>საფოსტო კოდი</FormLabel>
                  <FormControl>
                    <Input placeholder="0108" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="billingCountry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ქვეყანა</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="GE">საქართველო</SelectItem>
                      <SelectItem value="US">აშშ</SelectItem>
                      <SelectItem value="UK">დიდი ბრიტანეთი</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            გაუქმება
          </Button>
          <Button type="submit">
            ბარათის დამატება
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}

// Add Bank Form Component (simplified for brevity)
function AddBankForm({ onClose }: { onClose: () => void }) {
  const form = useForm<z.infer<typeof bankFormSchema>>({
    resolver: zodResolver(bankFormSchema),
    defaultValues: {
      accountNumber: "",
      routingNumber: "",
      accountHolderName: "",
      bankName: "",
      accountType: "checking",
    },
  })

  const onSubmit = async (values: z.infer<typeof bankFormSchema>) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('საბანკო ანგარიში დაემატა')
      onClose()
    } catch (error) {
      toast.error('დაფიქსირდა შეცდომა')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            საბანკო მონაცემები დაცულია SSL შიფრაციით
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="bankName"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>ბანკის დასახელება</FormLabel>
                <FormControl>
                  <Input placeholder="თიბისი ბანკი" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="accountNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ანგარიშის ნომერი</FormLabel>
                <FormControl>
                  <Input placeholder="12345678901234567890" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="routingNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Routing ნომერი</FormLabel>
                <FormControl>
                  <Input placeholder="021000021" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="accountHolderName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ანგარიშის მფლობელი</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="accountType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ანგარიშის ტიპი</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="checking">მიმდინარე</SelectItem>
                    <SelectItem value="savings">შემნახველი</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            გაუქმება
          </Button>
          <Button type="submit">
            ანგარიშის დამატება
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}

// Add PayPal Form Component (simplified)
function AddPayPalForm({ onClose }: { onClose: () => void }) {
  const form = useForm<z.infer<typeof paypalFormSchema>>({
    resolver: zodResolver(paypalFormSchema),
    defaultValues: {
      email: "",
    },
  })

  const onSubmit = async (values: z.infer<typeof paypalFormSchema>) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('PayPal ანგარიში დაემატა')
      onClose()
    } catch (error) {
      toast.error('დაფიქსირდა შეცდომა')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>PayPal ელ.ფოსტა</FormLabel>
              <FormControl>
                <Input 
                  type="email" 
                  placeholder="user@example.com" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            PayPal-ით გადახდა უსაფრთხო და სწრაფია
          </AlertDescription>
        </Alert>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            გაუქმება
          </Button>
          <Button type="submit">
            PayPal-ის დამატება
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}

// Loading skeleton
export function PaymentMethodsSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-6 w-6" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <div className="flex gap-1">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-8 w-32 mt-4" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}