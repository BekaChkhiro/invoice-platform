'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { AutomationManagement } from '@/components/settings/automation-management'

export default function AutomationSettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/settings">
            <ArrowLeft className="w-4 h-4 mr-2" />
            პარამეტრებში დაბრუნება
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ავტომატიზაციის პარამეტრები</h1>
          <p className="text-muted-foreground">
            მართეთ საბსქრიბშენების ავტომატური პროცესები
          </p>
        </div>
      </div>

      <AutomationManagement />
    </div>
  )
}