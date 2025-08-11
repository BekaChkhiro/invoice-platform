"use client"

import * as React from "react"
import { Check, X, CreditCard, AlertCircle, Loader2 } from "lucide-react"
import { format, addMonths } from "date-fns"
import { ka } from "date-fns/locale"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { SubscriptionPlan } from "@/types/subscription"

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  currentPlan: SubscriptionPlan
  newPlan: SubscriptionPlan
  onConfirm: (paymentMethod?: string) => Promise<void>
}

const FEATURE_LABELS = {
  max_invoices_per_month: 'ინვოისები თვეში',
  max_clients: 'მაქსიმალური კლიენტები',
  max_products: 'მაქსიმალური პროდუქტები',
  can_export_pdf: 'PDF ექსპორტი',
  can_send_email: 'ელ.ფოსტით გაგზავნა',
  can_use_api: 'API წვდომა',
  can_use_recurring_invoices: 'განმეორებადი ინვოისები',
  can_use_multi_currency: 'მულტი-ვალუტა',
  can_use_custom_branding: 'ბრენდირება',
  can_use_team_members: 'გუნდის წევრები',
  max_team_members: 'მაქს. გუნდის წევრები',
  storage_limit_mb: 'საცავი (MB)',
  priority_support: 'პრიორიტეტული მხარდაჭერა',
  custom_domain: 'პერსონალური დომენი',
  webhook_integrations: 'Webhook ინტეგრაციები',
  advanced_analytics: 'გაფართოებული ანალიტიკა',
  audit_logs: 'აუდიტის ლოგები',
  data_retention_days: 'მონაცემების შენახვა (დღე)',
}

const PAYMENT_METHODS = [
  { id: 'card', label: 'საკრედიტო ბარათი', icon: CreditCard },
  { id: 'bank_transfer', label: 'საბანკო გადარიცხვა', icon: CreditCard },
  { id: 'paypal', label: 'PayPal', icon: CreditCard },
]

export function UpgradeModal({
  isOpen,
  onClose,
  currentPlan,
  newPlan,
  onConfirm,
}: UpgradeModalProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState('card')
  const [isProcessing, setIsProcessing] = React.useState(false)
  
  const isUpgrade = newPlan.price_monthly > currentPlan.price_monthly
  const isDowngrade = newPlan.price_monthly < currentPlan.price_monthly
  
  const priceDifference = Math.abs(newPlan.price_monthly - currentPlan.price_monthly)
  const nextBillingDate = format(addMonths(new Date(), 1), 'dd MMMM, yyyy', { locale: ka })
  
  const handleConfirm = async () => {
    try {
      setIsProcessing(true)
      await onConfirm(isUpgrade ? selectedPaymentMethod : undefined)
      toast.success(
        isUpgrade ? 'გეგმა წარმატებით განახლდა' : 'გეგმა წარმატებით შეიცვალა'
      )
      onClose()
    } catch (error) {
      toast.error('დაფიქსირდა შეცდომა. გთხოვთ სცადოთ თავიდან')
      console.error('Upgrade/downgrade error:', error)
    } finally {
      setIsProcessing(false)
    }
  }
  
  const compareFeatures = () => {
    const features: Array<{
      key: string
      label: string
      current: any
      new: any
    }> = []
    
    Object.keys(FEATURE_LABELS).forEach((key) => {
      const featureKey = key as keyof typeof FEATURE_LABELS
      const currentValue = currentPlan.features[featureKey as keyof typeof currentPlan.features]
      const newValue = newPlan.features[featureKey as keyof typeof newPlan.features]
      
      if (currentValue !== newValue) {
        features.push({
          key,
          label: FEATURE_LABELS[featureKey],
          current: currentValue,
          new: newValue,
        })
      }
    })
    
    return features
  }
  
  const formatFeatureValue = (value: any) => {
    if (value === null) return 'ულიმიტო'
    if (value === true) return <Check className="h-4 w-4 text-green-500" />
    if (value === false) return <X className="h-4 w-4 text-muted-foreground" />
    return value
  }
  
  const changedFeatures = compareFeatures()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isUpgrade ? 'გეგმის განახლება' : isDowngrade ? 'გეგმის ჩამოწევა' : 'გეგმის შეცვლა'}
          </DialogTitle>
          <DialogDescription>
            {currentPlan.name} → {newPlan.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="font-medium text-sm text-muted-foreground">მიმდინარე გეგმა</h3>
              <div className="p-4 border rounded-lg bg-muted/50">
                <p className="font-semibold">{currentPlan.name}</p>
                <p className="text-2xl font-bold mt-2">
                  ₾{currentPlan.price_monthly}
                  <span className="text-sm font-normal text-muted-foreground">/თვე</span>
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium text-sm text-muted-foreground">ახალი გეგმა</h3>
              <div className="p-4 border rounded-lg border-primary bg-primary/5">
                <p className="font-semibold">{newPlan.name}</p>
                <p className="text-2xl font-bold mt-2">
                  ₾{newPlan.price_monthly}
                  <span className="text-sm font-normal text-muted-foreground">/თვე</span>
                </p>
              </div>
            </div>
          </div>
          
          {changedFeatures.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-medium">რა იცვლება</h3>
                <div className="space-y-2">
                  {changedFeatures.map((feature) => (
                    <div 
                      key={feature.key}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <span className="text-sm font-medium">{feature.label}</span>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {formatFeatureValue(feature.current)}
                          </span>
                          <span className="text-muted-foreground">→</span>
                          <span className={cn(
                            "text-sm font-medium",
                            isUpgrade ? "text-green-600" : "text-orange-600"
                          )}>
                            {formatFeatureValue(feature.new)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          
          {isUpgrade && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-medium">გადახდის მეთოდი</h3>
                <RadioGroup 
                  value={selectedPaymentMethod} 
                  onValueChange={setSelectedPaymentMethod}
                >
                  {PAYMENT_METHODS.map((method) => (
                    <div 
                      key={method.id}
                      className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    >
                      <RadioGroupItem value={method.id} id={method.id} />
                      <Label 
                        htmlFor={method.id} 
                        className="flex items-center gap-2 cursor-pointer flex-1"
                      >
                        <method.icon className="h-4 w-4" />
                        {method.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </>
          )}
          
          <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              <ul className="space-y-1 mt-2">
                <li>• ცვლილებები ძალაში შევა დაუყოვნებლივ</li>
                <li>• შემდეგი ბილინგი: {nextBillingDate}</li>
                {isUpgrade && (
                  <li>• დამატებითი თანხა: ₾{priceDifference}/თვე</li>
                )}
                {isDowngrade && (
                  <li>• დაზოგილი თანხა: ₾{priceDifference}/თვე</li>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
          >
            გაუქმება
          </Button>
          <Button
            variant={isUpgrade ? "default" : "secondary"}
            onClick={handleConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                მუშავდება...
              </>
            ) : (
              <>
                {isUpgrade ? 'განახლება' : isDowngrade ? 'ჩამოწევა' : 'დადასტურება'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface QuickUpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  targetPlan: 'basic' | 'pro'
  userId: string
}

export function QuickUpgradeModal({
  isOpen,
  onClose,
  targetPlan,
  userId,
}: QuickUpgradeModalProps) {
  const [isProcessing, setIsProcessing] = React.useState(false)
  
  const planDetails = {
    basic: {
      name: 'ძირითადი',
      price: 29,
      features: ['50 ინვოისი/თვე', 'ულიმიტო კლიენტები', 'ელ.ფოსტით გაგზავნა', 'ლოგო'],
    },
    pro: {
      name: 'პროფესიონალური', 
      price: 79,
      features: ['ულიმიტო ინვოისები', 'ულიმიტო კლიენტები', 'ყველა ფუნქცია', '24/7 მხარდაჭერა'],
    },
  }
  
  const plan = planDetails[targetPlan]
  
  const handleConfirm = async () => {
    try {
      setIsProcessing(true)
      const { subscriptionService } = await import('@/lib/services/subscription')
      await subscriptionService.upgradePlan(userId, targetPlan)
      toast.success('გეგმა წარმატებით განახლდა')
      onClose()
    } catch (error) {
      toast.error('დაფიქსირდა შეცდომა')
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>გეგმის სწრაფი განახლება</DialogTitle>
          <DialogDescription>
            განახლება {plan.name} გეგმაზე
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 border rounded-lg bg-primary/5 border-primary">
            <p className="font-semibold">{plan.name} გეგმა</p>
            <p className="text-2xl font-bold mt-2">
              ₾{plan.price}
              <span className="text-sm font-normal text-muted-foreground">/თვე</span>
            </p>
            <ul className="mt-4 space-y-2">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              ცვლილებები ძალაში შევა დაუყოვნებლივ და დაგერიცხებათ ახალი ტარიფი
            </AlertDescription>
          </Alert>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            გაუქმება
          </Button>
          <Button onClick={handleConfirm} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                მუშავდება...
              </>
            ) : (
              'განახლება'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}