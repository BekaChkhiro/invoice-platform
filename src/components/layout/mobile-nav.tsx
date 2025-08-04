"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings,
  User
} from "lucide-react"

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
  {
    name: "პარამეტრები",
    href: "/dashboard/settings",
    icon: Settings,
  },
  {
    name: "პროფილი",
    href: "/dashboard/profile",
    icon: User,
  },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 lg:hidden">
      <div className="grid grid-cols-5 h-16">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
                          (item.href !== '/dashboard' && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-xs transition-colors",
                isActive
                  ? "text-primary"
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5",
                isActive && "text-primary"
              )} />
              <span className="truncate">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}