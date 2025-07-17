"use client"

import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  Menu,
  Building2,
  Users,
  Wrench,
  Activity,
  FileText,
  Fuel,
  DollarSign,
  BarChart3,
  Calendar,
  Settings,
  User,
  Home,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useState } from "react"

const navigationItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: Home,
    description: "Overview and statistics",
  },
  {
    title: "Projects",
    href: "/projects",
    icon: Building2,
    description: "Manage construction projects",
  },
  {
    title: "Activities",
    href: "/activities",
    icon: Activity,
    description: "Track project activities",
  },
  {
    title: "Equipment",
    href: "/equipment",
    icon: Wrench,
    description: "Equipment management",
  },
  {
    title: "Employees",
    href: "/employees",
    icon: Users,
    description: "Team management",
  },
  {
    title: "Clients",
    href: "/clients",
    icon: User,
    description: "Client information",
  },
  {
    title: "Fuel Management",
    href: "/fuel-management",
    icon: Fuel,
    description: "Fuel requests and tracking",
  },
  {
    title: "Invoices",
    href: "/invoices",
    icon: DollarSign,
    description: "Invoice management",
  },
  {
    title: "Reports",
    href: "/reports",
    icon: FileText,
    description: "Generate reports",
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    description: "Data insights",
  },
  {
    title: "Calendar",
    href: "/calendar",
    icon: Calendar,
    description: "Schedule and events",
  },
]

const quickActions = [
  {
    title: "New Project",
    href: "/projects/new",
    icon: Building2,
    color: "bg-blue-500",
  },
  {
    title: "Add Equipment",
    href: "/equipment/new",
    icon: Wrench,
    color: "bg-cyan-500",
  },
  {
    title: "New Employee",
    href: "/employees/new",
    icon: Users,
    color: "bg-green-500",
  },
  {
    title: "Fuel Request",
    href: "/fuel-management/request",
    icon: Fuel,
    color: "bg-orange-500",
  },
]

export function MobileNav() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Don't render if not authenticated
  if (status === "loading" || status === "unauthenticated" || !session?.user) {
    return null
  }

  const handleNavigation = () => {
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden fixed top-4 left-4 z-50 bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white/95 transition-all duration-200"
        >
          <Menu className="h-5 w-5 text-slate-700" />
          <span className="sr-only">Open navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0 bg-white">
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation Menu</SheetTitle>
        </SheetHeader>

        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Construct Master</h2>
                <p className="text-sm text-blue-100">Construction Management</p>
              </div>
            </div>

            {/* User Info */}
            <div className="mt-4 p-3 bg-white/10 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    {session.user.firstName} {session.user.lastName}
                  </p>
                  <p className="text-xs text-blue-100 capitalize">{session.user.role?.toLowerCase()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  onClick={handleNavigation}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors group"
                >
                  <div
                    className={`p-2 rounded-lg ${action.color} text-white group-hover:scale-110 transition-transform`}
                  >
                    <action.icon className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-medium text-slate-700 text-center">{action.title}</span>
                </Link>
              ))}
            </div>
          </div>

          <Separator />

          {/* Navigation List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Navigation</h3>
              <nav className="space-y-1">
                {navigationItems.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={handleNavigation}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 group ${
                        isActive
                          ? "bg-blue-50 text-blue-700 shadow-sm"
                          : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <div
                        className={`p-2 rounded-lg transition-colors ${
                          isActive
                            ? "bg-blue-100 text-blue-600"
                            : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium truncate">{item.title}</span>
                          {isActive && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                              Active
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{item.description}</p>
                      </div>
                      <ChevronRight
                        className={`h-4 w-4 transition-transform ${
                          isActive ? "text-blue-500" : "text-slate-400 group-hover:text-slate-600"
                        }`}
                      />
                    </Link>
                  )
                })}
              </nav>
            </div>
          </div>

          <Separator />

          {/* Footer */}
          <div className="p-4">
            <Link
              href="/settings"
              onClick={handleNavigation}
              className="flex items-center gap-3 p-3 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors group"
            >
              <div className="p-2 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-slate-200">
                <Settings className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <span className="font-medium">Settings</span>
                <p className="text-xs text-slate-500">App preferences</p>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600" />
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
