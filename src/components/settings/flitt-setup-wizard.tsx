'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useFlittConfig } from "@/hooks/use-flitt-config"
import { CheckCircle, AlertCircle, Loader2, ExternalLink, Eye, EyeOff } from "lucide-react"

export function FlittSetupWizard() {
  const {
    config,
    isLoading,
    isSaving,
    isTesting,
    saveCredentials,
    updateSettings,
    testConnection,
    removeConfiguration
  } = useFlittConfig()

  const [step, setStep] = useState<'intro' | 'credentials' | 'test' | 'complete'>('intro')
  const [formData, setFormData] = useState({
    merchant_id: '',
    secret_key: '',
    test_mode: true
  })
  const [showSecretKey, setShowSecretKey] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)

  // Auto-detect setup state
  const setupState = (() => {
    if (!config) return 'loading'
    if (!config.has_secret_key) return 'not-configured'
    if (!config.enabled) return 'configured-disabled'
    return 'configured-enabled'
  })()

  const handleSaveCredentials = async () => {
    if (!formData.merchant_id || !formData.secret_key) return

    const success = await saveCredentials(formData)
    if (success) {
      setStep('test')
    }
  }

  const handleTestConnection = async () => {
    const result = await testConnection()
    setTestResult(result)
    
    if (result.success) {
      setStep('complete')
    }
  }

  const handleToggleMode = async (test_mode: boolean) => {
    await updateSettings({ test_mode })
    setFormData(prev => ({ ...prev, test_mode }))
  }

  const handleToggleEnabled = async (enabled: boolean) => {
    await updateSettings({ enabled })
  }

  const resetWizard = () => {
    setStep('intro')
    setFormData({ merchant_id: '', secret_key: '', test_mode: true })
    setTestResult(null)
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          იტვირთება...
        </CardContent>
      </Card>
    )
  }

  // Already configured - show status
  if (setupState === 'configured-enabled' || setupState === 'configured-disabled') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Flitt Payment კონფიგურაცია
          </CardTitle>
          <CardDescription>
            თქვენი Flitt Payment ინტეგრაცია მზადაა საბსქრიბშენებისთვის
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Overview */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-gray-600">Merchant ID</Label>
              <p className="font-mono text-sm">{config?.merchant_id}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-600">სტატუსი</Label>
              <div className="flex items-center gap-2">
                <Badge variant={config?.enabled ? "default" : "secondary"}>
                  {config?.enabled ? "აქტიური" : "გათიშული"}
                </Badge>
                {config?.test_mode && (
                  <Badge variant="outline">Test Mode</Badge>
                )}
              </div>
            </div>
          </div>

          {config?.setup_completed_at && (
            <div>
              <Label className="text-sm text-gray-600">კონფიგურაციის თარიღი</Label>
              <p className="text-sm">
                {new Date(config.setup_completed_at).toLocaleString('ka-GE')}
              </p>
            </div>
          )}

          <Separator />

          {/* Controls */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enabled">Flitt საბსქრიბშენები</Label>
                <p className="text-sm text-gray-600">
                  ჩართული რომ იყოს საბსქრიბშენების შექმნა
                </p>
              </div>
              <Switch
                id="enabled"
                checked={config?.enabled || false}
                onCheckedChange={handleToggleEnabled}
                disabled={isSaving}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="test_mode">Test Mode</Label>
                <p className="text-sm text-gray-600">
                  ტესტ რეჟიმში გადახდები არ ჩატარდება
                </p>
              </div>
              <Switch
                id="test_mode"
                checked={config?.test_mode ?? true}
                onCheckedChange={handleToggleMode}
                disabled={isSaving}
              />
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={isTesting}
            >
              {isTesting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              კავშირის ტესტირება
            </Button>

            <Button
              variant="outline"
              onClick={() => window.open('https://merchant.flitt.com', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Flitt Portal
            </Button>

            <Button
              variant="destructive"
              onClick={removeConfiguration}
              disabled={isSaving}
            >
              კონფიგურაციის წაშლა
            </Button>
          </div>

          {config?.last_test_at && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                ბოლო წარმატებული ტესტი: {new Date(config.last_test_at).toLocaleString('ka-GE')}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    )
  }

  // Setup wizard for new configuration
  return (
    <Card>
      <CardHeader>
        <CardTitle>Flitt Payment Setup</CardTitle>
        <CardDescription>
          კონფიგურირება ავტომატური საბსქრიბშენებისთვის
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center space-x-2 text-sm">
          <div className={`flex items-center gap-1 ${step === 'intro' ? 'text-blue-600' : step === 'credentials' || step === 'test' || step === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-2 h-2 rounded-full ${step === 'intro' ? 'bg-blue-600' : step === 'credentials' || step === 'test' || step === 'complete' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
            შესავალი
          </div>
          <div className="w-4 h-px bg-gray-200"></div>
          <div className={`flex items-center gap-1 ${step === 'credentials' ? 'text-blue-600' : step === 'test' || step === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-2 h-2 rounded-full ${step === 'credentials' ? 'bg-blue-600' : step === 'test' || step === 'complete' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
            კრედენციალები
          </div>
          <div className="w-4 h-px bg-gray-200"></div>
          <div className={`flex items-center gap-1 ${step === 'test' ? 'text-blue-600' : step === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-2 h-2 rounded-full ${step === 'test' ? 'bg-blue-600' : step === 'complete' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
            ტესტირება
          </div>
          <div className="w-4 h-px bg-gray-200"></div>
          <div className={`flex items-center gap-1 ${step === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-2 h-2 rounded-full ${step === 'complete' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
            დასრულება
          </div>
        </div>

        {/* Step Content */}
        {step === 'intro' && (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>საჭირო ნაბიჯები:</strong>
                <ol className="mt-2 space-y-1 ml-4 list-decimal">
                  <li>რეგისტრაცია <a href="https://merchant.flitt.com" target="_blank" className="text-blue-600 hover:underline inline-flex items-center">Flitt Merchant Portal-ში <ExternalLink className="h-3 w-3 ml-1" /></a></li>
                  <li>ახალი მერჩანტის შექმნა</li>
                  <li>Merchant ID და Secret Key-ის მოპოვება</li>
                </ol>
              </AlertDescription>
            </Alert>

            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <h4 className="font-medium">რას მოგცემთ ავტომატური საბსქრიბშენები:</h4>
              <ul className="text-sm space-y-1 text-gray-600 ml-4 list-disc">
                <li>ყოველთვიური ავტომატური გადახდები</li>
                <li>თქვენს ბანკის ანგარიშზე პირდაპირ შემოსავალი</li>
                <li>კლიენტებისთვის public link მართვისთვის</li>
                <li>სრული ანალიტიკა და რეპორტები</li>
              </ul>
            </div>

            <Button onClick={() => setStep('credentials')} className="w-full">
              გაგრძელება
            </Button>
          </div>
        )}

        {step === 'credentials' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="merchant_id">Merchant ID *</Label>
              <Input
                id="merchant_id"
                placeholder="მაგ. 1549901"
                value={formData.merchant_id}
                onChange={(e) => setFormData(prev => ({ ...prev, merchant_id: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="secret_key">Secret Key *</Label>
              <div className="relative">
                <Input
                  id="secret_key"
                  type={showSecretKey ? 'text' : 'password'}
                  placeholder="Secret Key Flitt-იდან"
                  value={formData.secret_key}
                  onChange={(e) => setFormData(prev => ({ ...prev, secret_key: e.target.value }))}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowSecretKey(!showSecretKey)}
                >
                  {showSecretKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="test_mode"
                checked={formData.test_mode}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, test_mode: checked }))}
              />
              <Label htmlFor="test_mode" className="text-sm">
                Test Mode (რეკომენდებული ჯერ)
              </Label>
            </div>

            {formData.test_mode && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Test Mode-ში გადახდები არ ჩატარდება. Production-ზე გადართვა შეძლებთ მოგვიანებით.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep('intro')}
              >
                უკან
              </Button>
              <Button
                onClick={handleSaveCredentials}
                disabled={!formData.merchant_id || !formData.secret_key || isSaving}
                className="flex-1"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                შენახვა და ტესტირება
              </Button>
            </div>
          </div>
        )}

        {step === 'test' && (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                კრედენციალები შენახულია! ახლა გავამოწმოთ Flitt API-სთან კავშირი.
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="w-full"
            >
              {isTesting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              {isTesting ? 'ტესტირება...' : 'API კავშირის ტესტირება'}
            </Button>

            {testResult && !testResult.success && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>ტესტი ჩაიშალა:</strong> {testResult.details || testResult.error}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {step === 'complete' && (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>მშვენივრად! 🎉</strong> Flitt Payment წარმატებით კონფიგურირდა.
              </AlertDescription>
            </Alert>

            <div className="bg-green-50 p-4 rounded-lg space-y-2">
              <h4 className="font-medium text-green-800">შემდეგი ნაბიჯები:</h4>
              <ul className="text-sm space-y-1 text-green-700 ml-4 list-disc">
                <li>კლიენტებისთვის საბსქრიბშენების შექმნა</li>
                <li>ტესტ გადახდის განხორციელება</li>
                <li>Production რეჟიმზე გადართვა</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => window.open('/dashboard/clients', '_self')}
                className="flex-1"
              >
                კლიენტების სია
              </Button>
              <Button
                onClick={resetWizard}
                variant="outline"
              >
                ხელახლა კონფიგურაცია
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}