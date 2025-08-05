"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  LogOut,
  CreditCard,
  ChevronRight,
  ChevronDown,
  Building2,
  User,
  UsersIcon,
  Crown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useAuth } from "@/hooks/use-auth"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"

const navigation = [
  {
    name: "დაშბორდი",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "ინვოისები",
    href: "/dashboard/invoices",
    icon: FileText,
  },
  {
    name: "კლიენტები",
    href: "/dashboard/clients",
    icon: Users,
  },
]

const settingsNavigation = [
  {
    name: "კომპანია",
    href: "/dashboard/settings/company",
    icon: Building2,
  },
  {
    name: "პროფილი",
    href: "/dashboard/settings/profile",
    icon: User,
  },
  {
    name: "ბილინგი",
    href: "/dashboard/settings/billing",
    icon: CreditCard,
  },
  {
    name: "გუნდი",
    href: "/dashboard/settings/team",
    icon: UsersIcon,
    isPro: true,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const [profile, setProfile] = useState<{ id: string; full_name: string | null; avatar_url: string | null } | null>(null)
  const [credits, setCredits] = useState<{ user_id: string; total_credits: number; used_credits: number; plan_type: string } | null>(null)
  const [company, setCompany] = useState<{ id: string; name: string } | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      loadUserData()
    }
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  // Hydration effect - runs only on client after mount
  useEffect(() => {
    setIsHydrated(true)
    
    // Read from localStorage after hydration
    const stored = localStorage.getItem('sidebar-settings-open')
    if (stored) {
      setSettingsOpen(JSON.parse(stored))
    } else if (pathname.startsWith('/dashboard/settings')) {
      setSettingsOpen(true)
    }
  }, [pathname])

  // Save to localStorage only after hydration
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('sidebar-settings-open', JSON.stringify(settingsOpen))
    }
  }, [settingsOpen, isHydrated])

  // Auto-expand when navigating to settings pages
  useEffect(() => {
    if (isHydrated && pathname.startsWith('/dashboard/settings') && !settingsOpen) {
      setSettingsOpen(true)
    }
  }, [pathname, isHydrated, settingsOpen])

  const loadUserData = async () => {
    if (!user) return

    try {
      // Load user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
      }

      // Load user credits
      const { data: creditsData } = await supabase
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

      // Load user company
      const { data: companyData } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (companyData) {
        setCompany(companyData)
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  const getInitials = (name: string | null) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
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

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-[260px] bg-gray-900 text-white">
      <div className="flex h-full flex-col">
        {/* Logo Section */}
        <div className="p-6">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Invoice Platform</h2>
              {company && (
                <p className="text-xs text-gray-400 truncate max-w-[140px]">
                  {company.name}
                </p>
              )}
            </div>
          </Link>
        </div>

        <Separator className="bg-gray-800" />

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || 
                            (item.href !== '/dashboard' && pathname.startsWith(item.href))
              
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-gray-800",
                      isActive
                        ? "bg-gray-800 text-white"
                        : "text-gray-400 hover:text-white"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                    {isActive && (
                      <ChevronRight className="ml-auto h-4 w-4" />
                    )}
                  </Link>
                </li>
              )
            })}

            {/* Settings Menu */}
            <li>
              <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-gray-800",
                      pathname.startsWith('/dashboard/settings')
                        ? "bg-gray-800 text-white"
                        : "text-gray-400 hover:text-white"
                    )}
                  >
                    <Settings className="h-5 w-5" />
                    <span>პარამეტრები</span>
                    {settingsOpen ? (
                      <ChevronDown className="ml-auto h-4 w-4" />
                    ) : (
                      <ChevronRight className="ml-auto h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 pl-6 pt-1">
                  {settingsNavigation.map((item) => {
                    const isActive = pathname === item.href
                    const isProOnly = item.isPro && credits?.plan_type === 'free'
                    
                    return (
                      <div key={item.name} className="relative">
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-gray-800",
                            isActive
                              ? "bg-gray-800 text-white"
                              : "text-gray-400 hover:text-white",
                            isProOnly && "opacity-50"
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.name}</span>
                          {item.isPro && (
                            <Crown className="h-3 w-3 text-yellow-500" />
                          )}
                          {isActive && (
                            <ChevronRight className="ml-auto h-4 w-4" />
                          )}
                        </Link>
                      </div>
                    )
                  })}
                </CollapsibleContent>
              </Collapsible>
            </li>
          </ul>
        </nav>

        {/* Credits Section */}
        {credits && (
          <div className="mx-6 mb-4">
            <div className="rounded-lg bg-gray-800 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">კრედიტები</span>
                {getPlanBadge(credits.plan_type)}
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-gray-400" />
                <span className="text-lg font-semibold">
                  {credits.total_credits - credits.used_credits}
                </span>
                <span className="text-sm text-gray-400">
                  / {credits.total_credits}
                </span>
              </div>
              {credits.plan_type === 'free' && (
                <Link href="/dashboard/settings/billing">
                  <Button variant="link" className="h-auto p-0 mt-2 text-xs text-primary-400">
                    განახლება Pro-ზე →
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}

        <Separator className="bg-gray-800" />

        {/* User Section */}
        <div className="p-4">
          <div className="flex items-center gap-3 rounded-lg p-3 hover:bg-gray-800 transition-colors">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-gray-700 text-white">
                {getInitials(profile?.full_name || null)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {profile?.full_name || "User"}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {user?.email}
              </p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 justify-start text-gray-400 hover:text-white hover:bg-gray-800"
            onClick={signOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            გასვლა
          </Button>
        </div>
      </div>
    </aside>
  )
}