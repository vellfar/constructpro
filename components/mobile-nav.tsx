"use client"

import * as React from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import {
  Building2,
  ChevronDown,
  Construction,
  Fuel,
  HardHat,
  Home,
  LogOut,
  Menu,
  Settings,
  User2,
  Users,
  Wrench,
  Activity,
  BarChart3,
  FileText,
  Receipt,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import Link from "next/link"

// Menu items
const navItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Projects",
    url: "/projects",
    icon: Construction,
  },
  {
    title: "Activities",
    url: "/activities",
    icon: Activity,
  },
  {
    title: "Employees",
    url: "/employees",
    icon: HardHat,
  },
  {
    title: "Equipment",
    url: "/equipment",
    icon: Wrench,
  },
  {
    title: "Clients",
    url: "/clients",
    icon: Building2,
  },
  {
    title: "Fuel Management",
    url: "/fuel-management",
    icon: Fuel,
  },
  {
    title: "Invoices",
    url: "/invoices",
    icon: Receipt,
  },
  {
    title: "Reports",
    url: "/reports",
    icon: BarChart3,
  },
  /*
  {
    title: "Analytics",
    url: "/analytics",
    icon: FileText,
  },*/
  {
    title: "Users",
    url: "/users",
    icon: Users,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
]

export function MobileNav() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = React.useState(false)

  // Don't render if not authenticated
  if (status === "loading" || status === "unauthenticated" || !session?.user) {
    return null
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: "/auth/login" })
    setOpen(false)
  }

  const user = session.user
  const userInitials =
    user.firstName && user.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`
      : user.name
          ?.split(" ")
          .map((n) => n[0])
          .join("") || "U"

  const userName = user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "User"

  return (
    <div className="flex items-center justify-between p-4 border-b bg-background md:hidden">
      {/* Logo */}
      <Link href="/" className="flex items-center space-x-2">
        <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Construction className="size-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold">ConstructPro</span>
          <span className="text-xs text-muted-foreground">Management</span>
        </div>
      </Link>

      {/* Mobile Menu */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-80 p-0 flex flex-col h-full">
          <SheetHeader className="p-6 border-b flex-shrink-0">
            <SheetTitle className="flex items-center space-x-2">
              <Construction className="h-5 w-5" />
              <span>ConstructPro</span>
            </SheetTitle>
          </SheetHeader>

          {/* User Profile Section */}
          <div className="p-4 border-b flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start p-2 h-auto">
                  <Avatar className="h-8 w-8 mr-3">
                    <AvatarImage src="/placeholder.svg?height=32&width=32" alt={userName} />
                    <AvatarFallback>{userInitials}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start flex-1">
                    <span className="text-sm font-medium">{userName}</span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {user.role?.replace("-", " ") || "Employee"}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/profile" onClick={() => setOpen(false)}>
                    <User2 className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Navigation Items - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            <nav className="p-4">
              <div className="space-y-2">
                {navItems.map((item) => {
                  const isActive = pathname === item.url
                  return (
                    <Link
                      key={item.title}
                      href={item.url}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center space-x-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      )}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <span>{item.title}</span>
                    </Link>
                  )
                })}
              </div>
            </nav>
          </div>

          {/* Footer */}
          <div className="p-4 border-t flex-shrink-0">
            <div className="text-xs text-muted-foreground text-center">© 2024 ConstructPro</div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
