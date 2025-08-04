"use client"

import { usePathname } from "next/navigation"
import { useState } from "react"
import { Menu, Bell, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Sidebar } from "./sidebar"
import { useAuth } from "@/hooks/use-auth"
import Link from "next/link"

interface TopBarProps {
  mobile?: boolean
}

export function TopBar({ mobile = false }: TopBarProps) {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Get page title based on route
  const getPageTitle = () => {
    if (pathname === "/dashboard") return "დაშბორდი"
    if (pathname.includes("/invoices")) return "ინვოისები"
    if (pathname.includes("/clients")) return "კლიენტები"
    if (pathname.includes("/settings")) return "პარამეტრები"
    return "Dashboard"
  }

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-[260px] z-30 h-16 bg-white border-b border-gray-200">
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          {mobile && (
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-[260px]">
                <Sidebar />
              </SheetContent>
            </Sheet>
          )}

          {/* Page title */}
          <h1 className="text-xl font-semibold text-gray-900">
            {getPageTitle()}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Search (Phase 2) */}
          <div className="hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="search"
                placeholder="ძებნა..."
                className="pl-10 w-[200px] lg:w-[300px]"
              />
            </div>
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center">
              3
            </Badge>
          </Button>

          {/* User menu (Desktop only) */}
          <div className="hidden lg:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.email}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings/profile">
                    პროფილი
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings/billing">
                    ბილინგი
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  გასვლა
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}