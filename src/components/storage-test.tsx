"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function StorageTest() {
  const [buckets, setBuckets] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const testStorage = async () => {
    setLoading(true)
    setError(null)

    try {
      // List buckets
      const { data: bucketsData, error: bucketsError } = await supabase.storage.listBuckets()
      
      if (bucketsError) {
        throw bucketsError
      }

      setBuckets(bucketsData || [])

      // Try to list files in avatars bucket
      const { data: files, error: filesError } = await supabase.storage
        .from('avatars')
        .list('', { limit: 1 })

      if (filesError) {
        console.log('Files error (expected if bucket is empty):', filesError)
      } else {
        console.log('Files in avatars bucket:', files)
      }

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    testStorage()
  }, [])

  const avatarsBucket = buckets.find(b => b.name === 'avatars')

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Storage Test</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button onClick={testStorage} disabled={loading}>
            {loading ? 'Testing...' : 'Test Storage'}
          </Button>

          {error && (
            <div className="text-red-600 text-sm">
              Error: {error}
            </div>
          )}

          <div>
            <h4 className="font-medium">Available Buckets:</h4>
            <ul className="text-sm text-gray-600">
              {buckets.map(bucket => (
                <li key={bucket.id}>
                  • {bucket.name} (public: {bucket.public ? 'yes' : 'no'})
                </li>
              ))}
            </ul>
          </div>

          <div className={`p-2 rounded ${avatarsBucket ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {avatarsBucket ? (
              <>✅ avatars bucket exists (public: {avatarsBucket.public ? 'yes' : 'no'})</>
            ) : (
              <>❌ avatars bucket NOT found - create it in Supabase Dashboard</>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}