"use client"

import { usePathname } from "next/navigation"
import { ChevronLeft, Bell, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { MobileNav } from "@/components/mobile-nav"

const pageNames: Record<string, string> = {
  "/": "Dashboard",
  "/projects": "Projects",
  "/activities": "Activities",
  "/employees": "Employees",
  "/equipment": "Equipment",
  "/clients": "Clients",
  "/fuel-management": "Fuel Management",
  "/invoices": "Invoices",
  "/reports": "Reports",
  "/analytics": "Analytics",
  "/users": "Users",
  "/settings": "Settings",
  "/calendar": "Calendar",
}

interface MobileHeaderProps {
  showBackButton?: boolean
  title?: string
}

export function MobileHeader({ showBackButton = false, title }: MobileHeaderProps) {
  const pathname = usePathname()
  const { data: session } = useSession()

  const getPageTitle = () => {
    if (title) return title

    // Handle dynamic routes
    if (pathname.includes("/new")) return "New"
    if (pathname.includes("/edit")) return "Edit"
    if (pathname.match(/\/\d+$/)) return "Details"

    return pageNames[pathname] || "Page"
  }

  const getBackPath = () => {
    const segments = pathname.split("/").filter(Boolean)
    if (segments.length <= 1) return "/"
    return "/" + segments.slice(0, -1).join("/")
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="flex h-16 items-center justify-between px-4">
        {/* Left side - Menu button, back button and title */}
        <div className="flex items-center space-x-2">
          {!showBackButton && <MobileNav />}
          {showBackButton && (
            <Button variant="ghost" size="icon" asChild>
              <Link href={getBackPath()}>
                <ChevronLeft className="h-4 w-4" />
              </Link>
            </Button>
          )}
          <h1 className="text-lg font-semibold ml-12">{getPageTitle()}</h1>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-2">
          {/* Search */}
          <Button variant="ghost" size="icon" className="hidden sm:flex">
            <Search className="h-4 w-4" />
            <span className="sr-only">Search</span>
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon">
            <Bell className="h-4 w-4" />
            <span className="sr-only">Notifications</span>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || ""} />
                  <AvatarFallback>
                    {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{session?.user?.name || "User"}</p>
                  <p className="text-xs leading-none text-muted-foreground">{session?.user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/auth/login" })}>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
