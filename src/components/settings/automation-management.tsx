'use client'

import { useState } from 'react'
import { Play, Pause, RefreshCw, Mail, Clock, CheckCircle, AlertCircle, Loader2, TestTube } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface AutomationStatus {
  edge_functions_available: boolean
  last_billing_run?: string
  last_notification_run?: string
  last_cleanup_run?: string
  pending_subscriptions: number
  pending_notifications: number
}

interface AutomationResult {
  success: boolean
  action: string
  result?: any
  error?: string
  timestamp: string
}

export function AutomationManagement() {
  const [status, setStatus] = useState<AutomationStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastResult, setLastResult] = useState<AutomationResult | null>(null)
  const [isDryRun, setIsDryRun] = useState(true)

  const runAutomation = async (action: string, processType?: string, emailType?: string) => {
    setIsLoading(true)
    setLastResult(null)

    try {
      const body: any = { action, dry_run: isDryRun }
      
      if (processType) body.process_type = processType
      if (emailType) body.email_type = emailType

      if (action === 'send_email' && emailType === 'verification_code') {
        body.client_email = 'test@example.com'
        body.client_name = 'Test User'
        body.company_name = 'Test Company'
        body.verification_code = 'TEST123'
      }

      const response = await fetch('/api/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Automation failed')
      }

      setLastResult(result)
    } catch (error) {
      setLastResult({
        success: false,
        action,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
    } finally {
      setIsLoading(false)
    }
  }

  const checkHealth = async () => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/automation?action=health')
      const result = await response.json()

      if (response.ok) {
        setStatus(result.automation_status)
        setLastResult({
          success: true,
          action: 'health_check',
          result: result.edge_functions,
          timestamp: new Date().toISOString()
        })
      } else {
        throw new Error(result.error || 'Health check failed')
      }
    } catch (error) {
      setLastResult({
        success: false,
        action: 'health_check',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Clock className="h-6 w-6" />
          ავტომატიზაციის მართვა
        </h2>
        <p className="text-gray-600 mt-1">
          მართეთ საბსქრიბშენების ავტომატური პროცესები და email notification-ები
        </p>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">სისტემის სტატუსი</CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={checkHealth}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Health Check
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {status ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Edge Functions</p>
                <div className="flex items-center gap-2 mt-1">
                  {status.edge_functions_available ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      ხელმისაწვდომია
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-red-100 text-red-800">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      მიუწვდომელია
                    </Badge>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">მოლოდინში მყოფი საბსქრიბშენები</p>
                <p className="font-semibold text-lg">{status.pending_subscriptions}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">ბოლო Billing Run</p>
                <p className="text-sm">
                  {status.last_billing_run 
                    ? new Date(status.last_billing_run).toLocaleString('ka-GE')
                    : 'არ ჩატარებულა'
                  }
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">მოლოდინში მყოფი Notification-ები</p>
                <p className="font-semibold text-lg">{status.pending_notifications}</p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">Health Check-ის ჩატარება სისტემის სტატუსის სანახავად</p>
          )}
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">პარამეტრები</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="dry_run">Dry Run რეჟიმი</Label>
              <p className="text-sm text-muted-foreground">
                ჩართული რომ იყოს, ცვლილებები არ შესრულდება (მხოლოდ სიმულაცია)
              </p>
            </div>
            <Switch
              id="dry_run"
              checked={isDryRun}
              onCheckedChange={setIsDryRun}
            />
          </div>
        </CardContent>
      </Card>

      {/* Automation Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Subscription Processing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              საბსქრიბშენების დამუშავება
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              ავტომატური billing, notification-ები და cleanup-ი
            </p>

            <div className="space-y-2">
              <Button 
                className="w-full justify-start"
                variant="outline"
                onClick={() => runAutomation('process_subscriptions', 'billing')}
                disabled={isLoading}
              >
                <Play className="h-4 w-4 mr-2" />
                Billing Process
              </Button>

              <Button 
                className="w-full justify-start"
                variant="outline"
                onClick={() => runAutomation('process_subscriptions', 'notifications')}
                disabled={isLoading}
              >
                <Mail className="h-4 w-4 mr-2" />
                Notification Process
              </Button>

              <Button 
                className="w-full justify-start"
                variant="outline"
                onClick={() => runAutomation('process_subscriptions', 'cleanup')}
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Cleanup Process
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Email Testing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Testing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              სხვადასხვა email template-ების ტესტირება
            </p>

            <div className="space-y-2">
              <Button 
                className="w-full justify-start"
                variant="outline"
                onClick={() => runAutomation('send_email', undefined, 'verification_code')}
                disabled={isLoading}
              >
                <TestTube className="h-4 w-4 mr-2" />
                Verification Email
              </Button>

              <Button 
                className="w-full justify-start"
                variant="outline"
                onClick={() => runAutomation('send_email', undefined, 'payment_confirmation')}
                disabled={isLoading}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Payment Confirmation
              </Button>

              <Button 
                className="w-full justify-start"
                variant="outline"
                onClick={() => runAutomation('send_email', undefined, 'payment_reminder')}
                disabled={isLoading}
              >
                <Clock className="h-4 w-4 mr-2" />
                Payment Reminder
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {lastResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {lastResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              ბოლო შედეგი
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">მოქმედება:</span>
                <Badge variant="outline">{lastResult.action}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-medium">სტატუსი:</span>
                <Badge variant={lastResult.success ? "default" : "destructive"}>
                  {lastResult.success ? 'წარმატებული' : 'ჩაშლილი'}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-medium">დრო:</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(lastResult.timestamp).toLocaleString('ka-GE')}
                </span>
              </div>

              {lastResult.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{lastResult.error}</AlertDescription>
                </Alert>
              )}

              {lastResult.result && (
                <div>
                  <Separator className="my-3" />
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <pre className="text-xs overflow-x-auto">
                      {JSON.stringify(lastResult.result, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help */}
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="text-center text-sm text-muted-foreground space-y-2">
            <p>
              <strong>📋 Billing Process:</strong> ქმნის ინვოისებს და აანახლებს შემდეგ billing თარიღებს
            </p>
            <p>
              <strong>📧 Notification Process:</strong> აგზავნის payment დასტურებებს და შეხსენებებს
            </p>
            <p>
              <strong>🧹 Cleanup Process:</strong> ასუფთავებს ძველ tokens-ებს და sessions-ებს
            </p>
            <p>
              <strong>🧪 Dry Run:</strong> ტესტ რეჟიმში არანაირი ცვლილება არ შესრულდება
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}