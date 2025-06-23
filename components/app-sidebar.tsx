"use client"

import type * as React from "react"
import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import {
  Building2,
  Users,
  Wrench,
  Fuel,
  FileText,
  Settings,
  Calendar,
  UserCircle,
  Home,
  Activity,
  Receipt,
  TrendingUp,
  Shield,
} from "lucide-react"
import { NavUser } from "@/components/nav-user"
import { Logo } from "@/components/brand/logo"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { cn } from "@/lib/utils"

// Simplified navigation data
const getNavigationItems = (userRole?: string) => {
  const isAdmin = userRole === "ADMIN"
  const isManager = userRole === "PROJECT_MANAGER" || userRole === "ADMIN"

  const baseItems = [
    { title: "Dashboard", url: "/", icon: Home },
    { title: "Projects", url: "/projects", icon: Building2 },
    { title: "Activities", url: "/activities", icon: Activity },
    { title: "Employees", url: "/employees", icon: Users },
    { title: "Equipment", url: "/equipment", icon: Wrench },
    { title: "Fuel Management", url: "/fuel-management", icon: Fuel },
    { title: "Clients", url: "/clients", icon: UserCircle },
    { title: "Invoices", url: "/invoices", icon: Receipt },
    { title: "Calendar", url: "/calendar", icon: Calendar },
    { title: "Analytics", url: "/analytics", icon: TrendingUp },
    { title: "Reports", url: "/reports", icon: FileText },
  ]

  const adminItems = [
    { title: "Users", url: "/users", icon: Shield },
    { title: "Settings", url: "/settings", icon: Settings },
  ]

  return isAdmin ? [...baseItems, ...adminItems] : baseItems
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  isMobile?: boolean
  onNavigate?: () => void
}

export function AppSidebar({ isMobile = false, onNavigate, ...props }: AppSidebarProps) {
  const { data: session } = useSession()
  const pathname = usePathname()

  const navigationItems = getNavigationItems(session?.user?.role)

  const user = {
    name: session?.user?.name || "Construction Manager",
    email: session?.user?.email || "manager@construction.com",
    avatar: session?.user?.image || "/placeholder.svg?height=32&width=32",
    role: session?.user?.role || "USER",
  }

  const handleNavigation = () => {
    if (onNavigate) {
      onNavigate()
    }
  }

  return (
    <Sidebar collapsible={isMobile ? "none" : "icon"} className={cn("border-r", isMobile && "border-r-0")} {...props}>
      <SidebarHeader className="border-b p-4">
        <Logo size="sm" showText={true} />
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarMenu className="space-y-1">
            {navigationItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={!isMobile ? item.title : undefined}
                  className={cn(
                    "h-10 px-3 rounded-lg transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    pathname === item.url && "bg-accent text-accent-foreground font-medium",
                  )}
                >
                  <Link href={item.url} className="flex items-center gap-3" onClick={handleNavigation}>
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-2">
        <NavUser user={user} />
      </SidebarFooter>

      {!isMobile && <SidebarRail />}
    </Sidebar>
  )
}
