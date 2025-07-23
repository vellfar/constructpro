"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  User,
  Menu,
  Home,
  FolderOpen,
  Activity,
  Users,
  Truck,
  Fuel,
  Building2,
  FileText,
  BarChart3,
  Settings,
  UserCheck,
  LogOut,
  ChevronRight,
} from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useSession, signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

// Navigation items with icons and roles
const NAV_ITEMS = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
    roles: ["Admin", "Project Manager", "Employee", "Store Manager"],
  },
  {
    title: "Projects",
    url: "/projects",
    icon: FolderOpen,
    roles: ["Admin", "Project Manager", "Employee"],
  },
  {
    title: "Activities",
    url: "/activities",
    icon: Activity,
    roles: ["Admin", "Project Manager", "Employee"],
  },
  {
    title: "Employees",
    url: "/employees",
    icon: Users,
    roles: ["Admin", "Project Manager"],
  },
  {
    title: "Equipment",
    url: "/equipment",
    icon: Truck,
    roles: ["Admin", "Project Manager", "Store Manager"],
  },
  {
    title: "Fuel Management",
    url: "/fuel-management",
    icon: Fuel,
    roles: ["Admin", "Project Manager", "Store Manager", "Employee"],
  },
  {
    title: "Clients",
    url: "/clients",
    icon: Building2,
    roles: ["Admin", "Project Manager"],
  },
  {
    title: "Invoices",
    url: "/invoices",
    icon: FileText,
    roles: ["Admin"],
  },
  {
    title: "Reports",
    url: "/reports",
    icon: BarChart3,
    roles: ["Admin"],
  },
  {
    title: "Users",
    url: "/users",
    icon: UserCheck,
    roles: ["Admin"],
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    roles: ["Admin"],
  },
]

const getNavigationItems = (userRole?: string) => {
  const role = userRole || "Employee"
  return NAV_ITEMS.filter((item) => item.roles.includes(role))
}

const getPageTitle = (pathname: string) => {
  const segments = pathname.split("/").filter(Boolean)
  if (pathname === "/") return "Dashboard"
  if (segments.length === 1) return segments[0][0].toUpperCase() + segments[0].slice(1)
  if (segments.length === 2 && segments[1] === "new") return `New ${segments[0].slice(0, -1)}`
  if (segments.length === 3 && segments[2] === "edit") return `Edit ${segments[0].slice(0, -1)}`
  return segments[segments.length - 1][0].toUpperCase() + segments[segments.length - 1].slice(1)
}

const getUserInitials = (name?: string) => {
  if (!name) return "U"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function MobileHeader() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const pageTitle = getPageTitle(pathname)
  const userRole = session?.user?.role || "USER"

  return (
    <div className="flex items-center justify-between w-full px-4 py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Navigation menu */}
      <SheetMenu userRole={userRole} />

      {/* Title */}
      <h1 className="text-lg font-semibold truncate flex-1 text-center mx-4">{pageTitle}</h1>

      {/* User menu */}
      <UserMenu session={session} />
    </div>
  )
}

// Enhanced navigation sidebar menu
function SheetMenu({ userRole }: { userRole: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const navigationItems = getNavigationItems(userRole)

  const handleNavigation = (url: string) => {
    setOpen(false) // Close the sheet
    router.push(url) // Navigate to the URL
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 p-0 hover:bg-accent">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open navigation</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-72 max-w-[85vw]">
        <SheetHeader className="p-6 pb-4 border-b">
          <SheetTitle className="text-left">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-base font-semibold">Construct Master</p>
                <p className="text-xs text-muted-foreground font-normal">Management System</p>
              </div>
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-full">
          <nav className="flex-1 p-4">
            <div className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.url

                return (
                  <button
                    key={item.title}
                    onClick={() => handleNavigation(item.url)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                      "hover:bg-accent hover:text-accent-foreground",
                      "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 flex-shrink-0",
                        isActive ? "text-primary-foreground" : "text-muted-foreground",
                      )}
                    />
                    <span className="flex-1 text-left">{item.title}</span>
                    {isActive && <ChevronRight className="h-4 w-4 text-primary-foreground" />}
                  </button>
                )
              })}
            </div>
          </nav>

          {/* Footer with user role */}
          <div className="p-4 border-t bg-muted/30">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <UserCheck className="h-3 w-3" />
              <span>Role: {userRole}</span>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// Enhanced user menu
function UserMenu({ session }: { session: any }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const handleNavigation = (url: string) => {
    setOpen(false)
    router.push(url)
  }

  const handleSignOut = async () => {
    setOpen(false)
    await signOut({ callbackUrl: "/auth/login" })
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 p-0 hover:bg-accent">
          <Avatar className="h-7 w-7">
            <AvatarImage src={session?.user?.image || "/placeholder.svg"} alt={session?.user?.name} />
            <AvatarFallback className="text-xs bg-primary text-primary-foreground">
              {getUserInitials(session?.user?.name)}
            </AvatarFallback>
          </Avatar>
          <span className="sr-only">Open user menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72 max-w-[85vw] p-0">
        <SheetHeader className="p-6 pb-4 border-b">
          <SheetTitle className="text-left">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={session?.user?.image || "/placeholder.svg"} alt={session?.user?.name} />
                <AvatarFallback className="text-sm bg-primary text-primary-foreground">
                  {getUserInitials(session?.user?.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold truncate">{session?.user?.name || "User"}</p>
                <p className="text-xs text-muted-foreground truncate font-normal">
                  {session?.user?.email || "user@example.com"}
                </p>
                <p className="text-xs text-muted-foreground font-normal mt-1">{session?.user?.role || "Employee"}</p>
              </div>
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col py-2">
          <button
            onClick={() => handleNavigation("/profile")}
            className="flex items-center gap-3 px-6 py-3 text-sm font-medium hover:bg-accent transition-colors"
          >
            <User className="h-4 w-4 text-muted-foreground" />
            <span>Profile</span>
          </button>

          <button
            onClick={() => handleNavigation("/settings")}
            className="flex items-center gap-3 px-6 py-3 text-sm font-medium hover:bg-accent transition-colors"
          >
            <Settings className="h-4 w-4 text-muted-foreground" />
            <span>Settings</span>
          </button>

          <Separator className="my-2" />

          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-6 py-3 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign out</span>
          </button>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-muted/30">
          <p className="text-xs text-muted-foreground text-center">Construct Master</p>
          <p className="text-xs text-muted-foreground text-center">Version 1.0.0</p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
