import { requireAuth } from "@/lib/supabase/helpers"
import { DashboardWrapper } from "@/components/layout/dashboard-wrapper"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check authentication
  await requireAuth()

  return (
    <DashboardWrapper>
      {children}
    </DashboardWrapper>
  )
}