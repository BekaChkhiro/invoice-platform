"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { 
  Loader2, 
  CreditCard, 
  Crown, 
  CheckCircle, 
  XCircle,
  Calendar,
  Zap,
  Users,
  FileText,
  Infinity
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: '₾',
    interval: 'თვე',
    credits: 5,
    features: [
      'ყოველთვიური 5 კრედიტი',
      'ძირითადი ინვოისები',
      'მაქს. 3 კლიენტი',
      'ელ.ფოსტით მხარდაჭერა',
    ],
    limitations: [
      'შეზღუდული ბრენდინგი',
      'ბაზიური რეპორტები',
    ]
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 29,
    currency: '₾',
    interval: 'თვე',
    credits: 50,
    features: [
      'ყოველთვიური 50 კრედიტი',
      'განახლებული ინვოისები',
      'უსასრულო კლიენტები',
      'პრიორიტეტული მხარდაჭერა',
      'ბრენდინგის კასტომიზაცია',
      'დეტალური რეპორტები',
    ],
    popular: true
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 59,
    currency: '₾',
    interval: 'თვე',
    credits: 'unlimited',
    features: [
      'უსასრულო კრედიტები',
      'ყველა ფუნქცია',
      'გუნდური მართვა',
      'API წვდომა',
      '24/7 მხარდაჭერა',
      'განაცვლი ინტეგრაციები',
      'მულტი-კომპანია',
    ]
  }
]

export default function BillingSettingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [credits, setCredits] = useState<any>(null)
  const [billingHistory, setBillingHistory] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    loadBillingData()
  }, [user])

  const loadBillingData = async () => {
    if (!user) return

    setIsLoading(true)

    try {
      // Load user credits
      const { data: creditsData, error: creditsError } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (creditsData) {
        setCredits(creditsData)
      } else {
        // Default credits for new users
        setCredits({
          user_id: user.id,
          total_credits: 5,
          used_credits: 0,
          plan_type: 'free'
        })
      }

      // Load billing history (placeholder for now)
      setBillingHistory([])

    } catch (error) {
      console.error('Error loading billing data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getPlanBadge = (planType: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      free: "secondary",
      basic: "default",
      pro: "destructive",
    }
    return (
      <Badge variant={variants[planType] || "secondary"} className="text-xs">
        {planType.toUpperCase()}
      </Badge>
    )
  }

  const getCreditsProgress = () => {
    if (!credits) return 0
    if (credits.plan_type === 'pro') return 100
    return ((credits.total_credits - credits.used_credits) / credits.total_credits) * 100
  }

  const handleUpgrade = (planId: string) => {
    toast({
      title: "განახლება",
      description: "გადახდის სისტემა მალე ხელმისაწვდომი იქნება",
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const currentPlan = plans.find(p => p.id === credits?.plan_type) || plans[0]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">ბილინგი და გეგმები</h1>
        <p className="text-gray-500">მართეთ თქვენი გადახდები და გეგმის დეტალები</p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                მიმდინარე გეგმა
              </CardTitle>
              <CardDescription>
                თქვენი აქტიური გეგმის დეტალები
              </CardDescription>
            </div>
            {getPlanBadge(credits?.plan_type || 'free')}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{currentPlan.name} Plan</h3>
              <p className="text-sm text-gray-500">
                {currentPlan.price === 0 ? 'უფასო' : `${currentPlan.price}${currentPlan.currency}/${currentPlan.interval}`}
              </p>
            </div>
            {credits?.plan_type === 'free' && (
              <Button onClick={() => handleUpgrade('basic')}>
                <Crown className="mr-2 h-4 w-4" />
                განახლება
              </Button>
            )}
          </div>

          {/* Credits Usage */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">კრედიტების გამოყენება</span>
              <span className="text-sm text-gray-500">
                {credits?.plan_type === 'pro' ? (
                  <span className="flex items-center gap-1">
                    <Infinity className="h-4 w-4" />
                    უსასრულო
                  </span>
                ) : (
                  `${credits?.used_credits || 0} / ${credits?.total_credits || 5}`
                )}
              </span>
            </div>
            {credits?.plan_type !== 'pro' && (
              <Progress value={getCreditsProgress()} className="h-2" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div>
        <h2 className="text-xl font-semibold mb-4">ხელმისაწვდომი გეგმები</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => {
            const isCurrentPlan = plan.id === credits?.plan_type
            const isPopular = plan.popular

            return (
              <Card key={plan.id} className={cn(
                "relative",
                isCurrentPlan && "border-primary",
                isPopular && "border-2 border-primary"
              )}>
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-white">
                      პოპულარული
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center gap-2">
                    {plan.id === 'pro' && <Crown className="h-5 w-5 text-yellow-500" />}
                    {plan.name}
                  </CardTitle>
                  <div className="text-3xl font-bold">
                    {plan.price === 0 ? 'უფასო' : (
                      <>
                        {plan.price}
                        <span className="text-lg text-gray-500">₾/თვე</span>
                      </>
                    )}
                  </div>
                  <CardDescription>
                    {plan.credits === 'unlimited' ? 'უსასრულო კრედიტები' : `${plan.credits} კრედიტი თვეში`}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                    {plan.limitations?.map((limitation, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-500">
                        <XCircle className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span>{limitation}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-4">
                    {isCurrentPlan ? (
                      <Button disabled className="w-full">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        მიმდინარე გეგმა
                      </Button>
                    ) : (
                      <Button 
                        className="w-full" 
                        variant={plan.id === 'free' ? 'outline' : 'default'}
                        onClick={() => handleUpgrade(plan.id)}
                      >
                        {plan.id === 'free' ? 'ჩამოტვირთვა' : 'განახლება'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            გადახდების ისტორია
          </CardTitle>
          <CardDescription>
            თქვენი წარსული გადახდების სია
          </CardDescription>
        </CardHeader>
        <CardContent>
          {billingHistory.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">გადახდების ისტორია არ მოიძებნა</p>
              <p className="text-sm text-gray-400 mt-1">
                თქვენი გადახდები გამოჩნდება აქ
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Billing history items would go here */}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}