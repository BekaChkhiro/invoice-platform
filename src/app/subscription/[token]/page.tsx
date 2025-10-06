'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Lock, Mail, Eye, EyeOff, Calendar, CreditCard, Building, User, CheckCircle, XCircle, Pause, Play, AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

interface SubscriptionData {
  id?: string
  service_name: string
  description?: string
  amount: number
  billing_cycle: string
  status: string
  start_date?: string
  next_billing_date?: string
  cancelled_at?: string
  client: {
    id?: string
    name: string
    type: string
    email?: string
    phone?: string
  }
  company: {
    id?: string
    name: string
    email?: string
    phone?: string
    address?: string
  }
}

interface SubscriptionResponse {
  subscription: SubscriptionData
  authenticated: boolean
  requires_verification?: boolean
  client_email_hint?: string
}

export default function PublicSubscriptionPage() {
  const params = useParams()
  const token = params.token as string
  
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Email verification states
  const [email, setEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [isRequestingAccess, setIsRequestingAccess] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [showVerificationForm, setShowVerificationForm] = useState(false)
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [devCode, setDevCode] = useState<string>('') // For development only
  
  // Subscription management states
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (token) {
      fetchSubscriptionData()
    }
  }, [token])

  useEffect(() => {
    // Check for existing session token
    const storedToken = localStorage.getItem(`subscription_session_${token}`)
    if (storedToken) {
      setSessionToken(storedToken)
    }
  }, [token])

  const fetchSubscriptionData = async (authToken?: string) => {
    try {
      setIsLoading(true)
      setError(null)

      const headers: HeadersInit = {}
      const tokenToUse = authToken || sessionToken
      if (tokenToUse) {
        headers.Authorization = `Bearer ${tokenToUse}`
      }

      const response = await fetch(`/api/subscription/${token}`, { headers })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'საბსქრიბშენის ჩატვირთვა ჩაიშალა')
      }

      setSubscriptionData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'სერვერის შეცდომა')
    } finally {
      setIsLoading(false)
    }
  }

  const requestAccess = async () => {
    if (!email.trim()) {
      setError('ელფოსტის შეყვანა სავალდებულოა')
      return
    }

    try {
      setIsRequestingAccess(true)
      setError(null)

      console.log('[Frontend] Requesting access with:', { token, email })

      const response = await fetch('/api/subscription/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email })
      })

      console.log('[Frontend] Response status:', response.status, response.statusText)
      console.log('[Frontend] Response headers:', Object.fromEntries(response.headers.entries()))

      // Get response text first
      const responseText = await response.text()
      console.log('[Frontend] Response text:', responseText)

      // Try to parse as JSON
      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error('[Frontend] JSON parse error:', parseError)
        throw new Error('სერვერმა დააბრუნა არასწორი პასუხი')
      }

      if (!response.ok) {
        throw new Error(data.error || 'წვდომის მოთხოვნა ჩაიშალა')
      }

      setShowVerificationForm(true)
      if (data.dev_code && process.env.NODE_ENV === 'development') {
        setDevCode(data.dev_code)
      }

    } catch (err) {
      console.error('[Frontend] Request access error:', err)
      setError(err instanceof Error ? err.message : 'სერვერის შეცდომა')
    } finally {
      setIsRequestingAccess(false)
    }
  }

  const verifyCode = async () => {
    if (!verificationCode.trim()) {
      setError('ვერიფიკაციის კოდის შეყვანა სავალდებულოა')
      return
    }

    try {
      setIsVerifying(true)
      setError(null)
      
      const response = await fetch('/api/subscription/access', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, code: verificationCode })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'ვერიფიკაცია ჩაიშალა')
      }
      
      // Store session token
      setSessionToken(data.session_token)
      localStorage.setItem(`subscription_session_${token}`, data.session_token)

      // Refresh subscription data with authentication (pass token directly to avoid race condition)
      await fetchSubscriptionData(data.session_token)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'სერვერის შეცდომა')
    } finally {
      setIsVerifying(false)
    }
  }

  const updateSubscriptionStatus = async (action: 'pause' | 'resume') => {
    if (!sessionToken) return

    try {
      setIsUpdating(true)
      setError(null)
      
      const response = await fetch(`/api/subscription/${token}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({ action })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'საბსქრიბშენის განახლება ჩაიშალა')
      }
      
      // Refresh data
      await fetchSubscriptionData()
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'სერვერის შეცდომა')
    } finally {
      setIsUpdating(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ka-GE', {
      style: 'currency',
      currency: 'GEL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getBillingCycleText = (cycle: string) => {
    const cycles = {
      weekly: 'კვირეული',
      monthly: 'ყოველთვიური',
      quarterly: 'კვარტალური',
      yearly: 'წლიური'
    }
    return cycles[cycle as keyof typeof cycles] || cycle
  }

  const getStatusConfig = (status: string) => {
    const configs = {
      active: { label: 'აქტიური', className: 'bg-green-100 text-green-800', icon: CheckCircle },
      paused: { label: 'პაუზა', className: 'bg-yellow-100 text-yellow-800', icon: Pause },
      cancelled: { label: 'გაუქმებული', className: 'bg-gray-100 text-gray-600', icon: XCircle }
    }
    return configs[status as keyof typeof configs] || configs.active
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="space-y-6">
            <div className="text-center">
              <Skeleton className="h-8 w-64 mx-auto mb-2" />
              <Skeleton className="h-4 w-48 mx-auto" />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Array.from({ length: 2 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Array.from({ length: 4 }).map((_, j) => (
                        <div key={j} className="flex justify-between">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error && !subscriptionData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
        <div className="max-w-md mx-auto px-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h1 className="text-xl font-semibold mb-2">შეცდომა მოხდა</h1>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={fetchSubscriptionData} variant="outline">
                თავიდან სცადეთ
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const subscription = subscriptionData?.subscription
  const isAuthenticated = subscriptionData?.authenticated
  const statusConfig = subscription ? getStatusConfig(subscription.status) : null

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {subscription?.service_name || 'საბსქრიბშენი'}
            </h1>
            <p className="text-gray-600">
              {subscription?.company?.name || 'კომპანია'} -ის მომსახურება
            </p>
            {statusConfig && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <Badge variant="secondary" className={statusConfig.className}>
                  <statusConfig.icon className="w-3 h-3 mr-1" />
                  {statusConfig.label}
                </Badge>
              </div>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Email Verification */}
          {!isAuthenticated && subscription && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  ელფოსტის დასტური
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  საბსქრიბშენის მართვისთვის საჭიროა თქვენი ელფოსტის დადასტურება
                </p>
                
                {subscriptionData.client_email_hint && (
                  <p className="text-sm text-muted-foreground">
                    გამოიყენეთ ელფოსტა: {subscriptionData.client_email_hint}
                  </p>
                )}

                {!showVerificationForm ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="email">ელფოსტის მისამართი</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="თქვენი ელფოსტა"
                        onKeyDown={(e) => e.key === 'Enter' && requestAccess()}
                      />
                    </div>
                    
                    <Button 
                      onClick={requestAccess} 
                      disabled={isRequestingAccess}
                      className="w-full"
                    >
                      {isRequestingAccess ? 'იგზავნება...' : 'ვერიფიკაციის კოდის მოთხოვნა'}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Alert>
                      <Mail className="h-4 w-4" />
                      <AlertDescription>
                        ვერიფიკაციის კოდი გაიგზავნა {email} მისამართზე
                        {devCode && process.env.NODE_ENV === 'development' && (
                          <span className="block mt-1 font-mono text-sm">
                            Dev კოდი: {devCode}
                          </span>
                        )}
                      </AlertDescription>
                    </Alert>
                    
                    <div>
                      <Label htmlFor="code">ვერიფიკაციის კოდი</Label>
                      <Input
                        id="code"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                        placeholder="6-ნიშნა კოდი"
                        maxLength={6}
                        onKeyDown={(e) => e.key === 'Enter' && verifyCode()}
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        onClick={verifyCode} 
                        disabled={isVerifying}
                        className="flex-1"
                      >
                        {isVerifying ? 'მოწმდება...' : 'დადასტურება'}
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setShowVerificationForm(false)
                          setVerificationCode('')
                          setDevCode('')
                        }}
                      >
                        უკან
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Subscription Details */}
          {subscription && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Service Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    სერვისის ინფორმაცია
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">სერვისი:</span>
                    <span className="font-medium">{subscription.service_name}</span>
                  </div>
                  
                  {subscription.description && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">აღწერა:</span>
                      <span className="font-medium text-right">{subscription.description}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">თანხა:</span>
                    <span className="font-bold text-lg">{formatCurrency(subscription.amount)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">პერიოდი:</span>
                    <span className="font-medium">{getBillingCycleText(subscription.billing_cycle)}</span>
                  </div>

                  {isAuthenticated && subscription.next_billing_date && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">შემდეგი გადახდა:</span>
                      <span className="font-medium">
                        {new Date(subscription.next_billing_date).toLocaleDateString('ka-GE')}
                      </span>
                    </div>
                  )}

                  {/* Payment Link */}
                  {isAuthenticated && subscription.flitt_payment_url && (
                    <div className="pt-4 border-t">
                      <Button
                        onClick={() => window.open(subscription.flitt_payment_url, '_blank')}
                        className="w-full"
                        variant="default"
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        გადახდის გვერდი
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Client Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {subscription.client.type === 'company' ? (
                      <Building className="w-5 h-5" />
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                    მფლობელი
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">სახელი:</span>
                    <span className="font-medium">{subscription.client?.name || 'არ არის მითითებული'}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ტიპი:</span>
                    <Badge variant="outline">
                      {subscription.client?.type === 'company' ? 'კომპანია' : 'ფიზ. პირი'}
                    </Badge>
                  </div>

                  {isAuthenticated && subscription.client?.email && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ელფოსტა:</span>
                      <span className="font-medium">{subscription.client.email}</span>
                    </div>
                  )}

                  {isAuthenticated && subscription.client?.phone && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ტელეფონი:</span>
                      <span className="font-medium">{subscription.client.phone}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Subscription Management */}
          {isAuthenticated && subscription && subscription.status !== 'cancelled' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  საბსქრიბშენის მართვა
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  {subscription.status === 'active' && (
                    <Button
                      variant="outline"
                      onClick={() => updateSubscriptionStatus('pause')}
                      disabled={isUpdating}
                      className="flex items-center gap-2"
                    >
                      <Pause className="w-4 h-4" />
                      საბსქრიბშენის პაუზა
                    </Button>
                  )}
                  
                  {subscription.status === 'paused' && (
                    <Button
                      onClick={() => updateSubscriptionStatus('resume')}
                      disabled={isUpdating}
                      className="flex items-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      საბსქრიბშენის განახლება
                    </Button>
                  )}
                </div>
                
                <p className="text-sm text-muted-foreground mt-4">
                  {subscription.status === 'active' 
                    ? 'საბსქრიბშენის პაუზით დროებით შეწყვეტთ ავტომატურ გადახდებს'
                    : 'საბსქრიბშენის განახლებით აღადგენთ ავტომატურ გადახდებს'
                  }
                </p>
              </CardContent>
            </Card>
          )}

          {/* Company Information */}
          {isAuthenticated && subscription && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  კომპანიის ინფორმაცია
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">კომპანია:</span>
                  <span className="font-medium">{subscription.company?.name || 'არ არის მითითებული'}</span>
                </div>

                {subscription.company?.email && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ელფოსტა:</span>
                    <span className="font-medium">{subscription.company.email}</span>
                  </div>
                )}

                {subscription.company?.phone && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ტელეფონი:</span>
                    <span className="font-medium">{subscription.company.phone}</span>
                  </div>
                )}

                {subscription.company?.address && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">მისამართი:</span>
                    <span className="font-medium text-right">{subscription.company.address}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}