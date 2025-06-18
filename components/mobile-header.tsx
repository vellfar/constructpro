"use client"
import { usePathname } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

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
}

interface MobileHeaderProps {
  showBackButton?: boolean
  title?: string
}

export function MobileHeader({ showBackButton = false, title }: MobileHeaderProps) {
  const pathname = usePathname()

  const getPageTitle = () => {
    if (title) return title

    // Handle dynamic routes
    if (pathname.includes("/new")) return "New"
    if (pathname.includes("/edit")) return "Edit"
    if (pathname.match(/\/\d+$/)) return "Details"

    return pageNames[pathname] || "Page"
  }

  return (
    <div className="flex items-center justify-between p-4 border-b bg-background md:hidden sticky top-0 z-40">
      <div className="flex items-center space-x-2">
        {showBackButton && (
          <Button variant="ghost" size="icon" asChild>
            <Link href={pathname.split("/").slice(0, -1).join("/") || "/"}>
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
        )}
        <h1 className="text-lg font-semibold">{getPageTitle()}</h1>
      </div>
    </div>
  )
}
