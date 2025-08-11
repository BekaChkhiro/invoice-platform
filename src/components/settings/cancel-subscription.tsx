"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { 
  AlertTriangle, 
  Calendar, 
  Download, 
  Pause, 
  Shield, 
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowRight,
  Loader2
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
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
  FormDescription,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { subscriptionService } from "@/lib/services/subscription"
import type { UserSubscription } from "@/types/subscription"

// Cancellation reasons
const CANCELLATION_REASONS = [
  { value: 'too_expensive', label: 'ძალიან ძვირია' },
  { value: 'not_using', label: 'არ ვიყენებ ხშირად' },
  { value: 'missing_features', label: 'არ არის საჭირო ფუნქციები' },
  { value: 'found_alternative', label: 'ვიპოვე უკეთესი ალტერნატივა' },
  { value: 'technical_issues', label: 'ტექნიკური პრობლემები' },
  { value: 'other', label: 'სხვა' },
]

// Form schema
const cancellationFormSchema = z.object({
  reason: z.enum([
    'too_expensive',
    'not_using', 
    'missing_features',
    'found_alternative',
    'technical_issues',
    'other'
  ], { required_error: "აირჩიეთ გაუქმების მიზეზი" }),
  feedback: z.string().max(500, "გამოხმაურება არ უნდა აღემატებოდეს 500 სიმბოლოს").optional(),
  cancelImmediately: z.boolean().default(false),
  confirmPassword: z.string().min(1, "პაროლი სავალდებულოა"),
  dataRetention: z.boolean().default(false),
  exportData: z.boolean().default(true),
})

interface CancelSubscriptionProps {
  userId: string
  subscription: UserSubscription
  className?: string
}

// Retention offers based on cancellation reason
const getRetentionOffer = (reason?: string) => {
  switch (reason) {
    case 'too_expensive':
      return {
        title: 'გავთავისუფლოთ თქვენგან 50% ფასისგან',
        description: 'მიღებული ფასდაკლებით გააგრძელეთ გამოწერა შემდეგი 3 თვის განმავლობაში',
        discount: '50%',
        action: 'ფასდაკლების მიღება'
      }
    case 'not_using':
      return {
        title: 'დავაყოვნოთ გამოწერა 3 თვით',
        description: 'შეგიძლიათ დაისვენოთ და თქვენი ანგარიში რჩება უცვლელი',
        discount: null,
        action: 'პაუზა 3 თვით'
      }
    case 'missing_features':
      return {
        title: 'ვმუშაობთ ახალ ფუნქციებზე',
        description: 'მომავალ თვეს ვიწყებთ ახალი ფუნქციების ტესტირებას. გსურთ ადრე მისვლა?',
        discount: null,
        action: 'ბეტა ტესტერი ვიყო'
      }
    default:
      return null
  }
}

export function CancelSubscription({ 
  userId, 
  subscription, 
  className 
}: CancelSubscriptionProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [currentStep, setCurrentStep] = React.useState<'reason' | 'retention' | 'confirm'>('reason')
  const [selectedReason, setSelectedReason] = React.useState<string>()
  const [showRetentionOffer, setShowRetentionOffer] = React.useState(false)
  
  const queryClient = useQueryClient()

  const form = useForm<z.infer<typeof cancellationFormSchema>>({
    resolver: zodResolver(cancellationFormSchema),
    defaultValues: {
      feedback: '',
      cancelImmediately: false,
      confirmPassword: '',
      dataRetention: false,
      exportData: true,
    },
  })

  // Cancel subscription mutation
  const cancelMutation = useMutation({
    mutationFn: () => subscriptionService.cancelSubscription(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-subscription', userId] })
      toast.success('გამოწერა წარმატებით გაუქმდა')
      setIsOpen(false)
      form.reset()
      setCurrentStep('reason')
    },
    onError: () => {
      toast.error('დაფიქსირდა შეცდომა. გთხოვთ სცადოთ თავიდან')
    },
  })

  const handleReasonSubmit = (reason: string) => {
    setSelectedReason(reason)
    form.setValue('reason', reason as any)
    
    const offer = getRetentionOffer(reason)
    if (offer && reason !== 'other') {
      setShowRetentionOffer(true)
      setCurrentStep('retention')
    } else {
      setCurrentStep('confirm')
    }
  }

  const handleRetentionOfferAccept = () => {
    // Handle retention offer acceptance
    toast.success('შეთავაზება მიღებული!')
    setIsOpen(false)
  }

  const handleRetentionOfferDecline = () => {
    setShowRetentionOffer(false)
    setCurrentStep('confirm')
  }

  const onSubmit = async (values: z.infer<typeof cancellationFormSchema>) => {
    try {
      // Validate password (in real app, verify against actual password)
      if (values.confirmPassword !== 'password123') {
        form.setError('confirmPassword', { message: 'არასწორი პაროლი' })
        return
      }

      await cancelMutation.mutateAsync()
    } catch (error) {
      console.error('Cancellation error:', error)
    }
  }

  const retentionOffer = showRetentionOffer ? getRetentionOffer(selectedReason) : null

  return (
    <div className={cn("space-y-4", className)}>
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>გაფრთხილება:</strong> გამოწერის გაუქმების შემდეგ თქვენ აღარ გექნებათ წვდომა პრემიუმ ფუნქციებზე
        </AlertDescription>
      </Alert>

      <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50 dark:border-red-900 dark:bg-red-950">
        <div>
          <h4 className="font-medium text-red-900 dark:text-red-100">
            გამოწერის გაუქმება
          </h4>
          <p className="text-sm text-red-700 dark:text-red-300 mt-1">
            ეს ქმედება გამოწერას საბოლოოდ გააუქმებს
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive">
              <XCircle className="h-4 w-4 mr-2" />
              გაუქმება
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            {/* Step 1: Cancellation Reason */}
            {currentStep === 'reason' && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    რატომ აუქმებთ გამოწერას?
                  </DialogTitle>
                  <DialogDescription>
                    გთხოვთ აგვიხსენოთ გამოწერის გაუქმების მიზეზი. ეს დაგვეხმარება სერვისის გაუმჯობესებაში.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                  {CANCELLATION_REASONS.map((reason) => (
                    <Button
                      key={reason.value}
                      variant="outline"
                      className="w-full justify-start h-auto p-4"
                      onClick={() => handleReasonSubmit(reason.value)}
                    >
                      <div className="text-left">
                        <p className="font-medium">{reason.label}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 ml-auto" />
                    </Button>
                  ))}
                </div>
              </>
            )}

            {/* Step 2: Retention Offer */}
            {currentStep === 'retention' && retentionOffer && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    სპეციალური შეთავაზება
                  </DialogTitle>
                  <DialogDescription>
                    ჩვენ ძალიან ვაფასებთ თქვენს აზრს. გთავაზობთ სპეციალურ შეთავაზებას.
                  </DialogDescription>
                </DialogHeader>

                <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
                  <CardHeader>
                    <CardTitle className="text-green-900 dark:text-green-100">
                      {retentionOffer.title}
                    </CardTitle>
                    <CardDescription className="text-green-700 dark:text-green-300">
                      {retentionOffer.description}
                    </CardDescription>
                  </CardHeader>
                  {retentionOffer.discount && (
                    <CardContent>
                      <Badge className="bg-green-500 text-white text-lg px-4 py-2">
                        {retentionOffer.discount} ფასდაკლება
                      </Badge>
                    </CardContent>
                  )}
                </Card>

                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    variant="outline"
                    onClick={handleRetentionOfferDecline}
                  >
                    გმადლობთ, მაგრამ მაინც გავაუქმებ
                  </Button>
                  <Button
                    onClick={handleRetentionOfferAccept}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {retentionOffer.action}
                  </Button>
                </DialogFooter>
              </>
            )}

            {/* Step 3: Final Confirmation */}
            {currentStep === 'confirm' && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    გამოწერის გაუქმების დადასტურება
                  </DialogTitle>
                  <DialogDescription>
                    ეს ქმედება საბოლოოა. გთხოვთ წაიკითხოთ და დაადასტუროთ.
                  </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* What happens when you cancel */}
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>რა მოხდება გაუქმების შემდეგ:</strong>
                        <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                          <li>გამოწერა გაუქმდება {subscription.current_period_end.split('T')[0]}-ის ბოლოს</li>
                          <li>დარჩენილი ინვოისები კვლავ ხელმისაწვდომი იქნება</li>
                          <li>ყველა მონაცემი დარჩება 90 დღის განმავლობაში</li>
                          <li>შეგიძლიათ ნებისმიერ დროს გაანახლოთ გამოწერა</li>
                        </ul>
                      </AlertDescription>
                    </Alert>

                    {/* Feedback */}
                    <FormField
                      control={form.control}
                      name="feedback"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>დამატებითი კომენტარი (არასავალდებულო)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="გვითხარით რა შეიძლება გავაუმჯობესოთ..."
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            თქვენი გამოხმაურება დაგვეხმარება სერვისის გაუმჯობესებაში
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Cancellation options */}
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="cancelImmediately"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                გაუქმება ახლავე
                              </FormLabel>
                              <FormDescription>
                                თუ არ მონიშნავთ, გამოწერა გაუქმდება მიმდინარე პერიოდის ბოლოს
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="exportData"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                მონაცემების ექსპორტი
                              </FormLabel>
                              <FormDescription>
                                გამოგიგზავნოთ ყველა ინვოისი და კლიენტი CSV ფორმატში
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="dataRetention"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                მონაცემების შენარჩუნება
                              </FormLabel>
                              <FormDescription>
                                შევნარჩუნოთ მონაცემები 1 წლის განმავლობაში (დაცული ფორმატში)
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />

                    {/* Password confirmation */}
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>პაროლის დადასტურება</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="შეიყვანეთ თქვენი პაროლი"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            უსაფრთხოებისთვის დაადასტურეთ თქვენი პაროლი
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsOpen(false)}
                        disabled={cancelMutation.isPending}
                      >
                        გაუქმება
                      </Button>
                      <Button
                        type="submit"
                        variant="destructive"
                        disabled={cancelMutation.isPending}
                      >
                        {cancelMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            იუქმება...
                          </>
                        ) : (
                          <>
                            <XCircle className="mr-2 h-4 w-4" />
                            გამოწერის გაუქმება
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Alternative options */}
      <div className="grid gap-3 md:grid-cols-2">
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Pause className="h-6 w-6 text-blue-600" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-900 dark:text-blue-100">
                  გამოწერის პაუზა
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  დროებით შეაჩერეთ გადახდები
                </p>
              </div>
              <Button variant="outline" size="sm" className="text-blue-600 border-blue-300">
                პაუზა
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Download className="h-6 w-6 text-green-600" />
              <div className="flex-1">
                <h4 className="font-medium text-green-900 dark:text-green-100">
                  მონაცემების ექსპორტი
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  ჩამოტვირთეთ ყველა ინვოისი
                </p>
              </div>
              <Button variant="outline" size="sm" className="text-green-600 border-green-300">
                ექსპორტი
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}