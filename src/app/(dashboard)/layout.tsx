import { redirect } from "next/navigation"
import { requireAuth, getCompany } from "@/lib/supabase/helpers"
import { Sidebar } from "@/components/layout/sidebar"
import { TopBar } from "@/components/layout/topbar"
import { MobileNav } from "@/components/layout/mobile-nav"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check authentication
  const user = await requireAuth()
  
  // Check if user has company setup
  const { data: company } = await getCompany(user.id)
  
  // If no company, redirect to onboarding
  // TODO: Temporarily disabled for testing
  // if (!company) {
  //   redirect("/onboarding")
  // }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Layout */}
      <div className="hidden lg:flex">
        <Sidebar />
        <div className="flex-1 ml-[260px]">
          <TopBar />
          <main className="p-6 mt-16">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden">
        <TopBar mobile />
        <main className="p-4 pb-20">
          {children}
        </main>
        <MobileNav />
      </div>
    </div>
  )
}