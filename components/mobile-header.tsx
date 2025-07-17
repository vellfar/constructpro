"use client"

import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { User, Menu } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { cn } from "@/lib/utils"

// Reuse NAV_ITEMS with roles from sidebar
const NAV_ITEMS = [
  { title: "Dashboard", url: "/", roles: ["Admin", "Project Manager", "Employee", "Store Manager"] },
  { title: "Projects", url: "/projects", roles: ["Admin", "Project Manager", "Employee"] },
  { title: "Activities", url: "/activities", roles: ["Admin", "Project Manager", "Employee"] },
  { title: "Employees", url: "/employees", roles: ["Admin", "Project Manager"] },
  { title: "Equipment", url: "/equipment", roles: ["Admin", "Project Manager", "Store Manager"] },
  { title: "Fuel Management", url: "/fuel-management", roles: ["Admin", "Project Manager", "Store Manager", "Employee"] },
  { title: "Clients", url: "/clients", roles: ["Admin", "Project Manager"] },
  { title: "Invoices", url: "/invoices", roles: ["Admin"] },
  { title: "Reports", url: "/reports", roles: ["Admin"] },
  { title: "Users", url: "/users", roles: ["Admin"] },
  { title: "Settings", url: "/settings", roles: ["Admin"] },
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

export function MobileHeader() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const pageTitle = getPageTitle(pathname)

  const userRole = session?.user?.role || "USER"

  return (
    <div className="flex items-center justify-between w-full px-2 py-2 border-b bg-background">
      {/* Hamburger menu */}
      <SheetMenu userRole={userRole} />
      {/* Title */}
      <h1 className="text-lg font-semibold truncate flex-1 text-center">{pageTitle}</h1>
      {/* User dropdown */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
            <User className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-64 p-0 sm:w-80">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>
              <div className="flex flex-col space-y-1">
                <p className="text-base font-medium leading-none">{session?.user?.name || "User"}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {session?.user?.email || "user@example.com"}
                </p>
              </div>
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col py-2">
            <Button variant="ghost" className="justify-start w-full rounded-none" asChild>
              <Link href="/profile">Profile</Link>
            </Button>
            <Button variant="ghost" className="justify-start w-full rounded-none" asChild>
              <Link href="/settings">Settings</Link>
            </Button>
            <div className="border-t my-2" />
            <Button
              variant="ghost"
              className="justify-start w-full rounded-none text-red-600"
              onClick={() => signOut()}
            >
              Sign out
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

// === MOBILE NAVIGATION SIDEBAR MENU ===
function SheetMenu({ userRole }: { userRole: string }) {
  const pathname = usePathname()
  const navigationItems = getNavigationItems(userRole)

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 p-0 mr-2">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open navigation</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-64 max-w-full">
        <nav className="flex flex-col gap-1 p-4">
          {navigationItems.map((item) => (
            <Link
              key={item.title}
              href={item.url}
              className={cn(
                "py-2 px-3 rounded transition-colors",
                pathname === item.url
                  ? "bg-muted text-foreground font-medium"
                  : "hover:bg-muted text-muted-foreground"
              )}
            >
              {item.title}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
