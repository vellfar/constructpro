"use client"

import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Bell, Search, User } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSession, signOut } from "next-auth/react"

const getPageTitle = (pathname: string) => {
  const segments = pathname.split("/").filter(Boolean)

  if (pathname === "/") return "Dashboard"
  if (segments.length === 1) {
    return segments[0].charAt(0).toUpperCase() + segments[0].slice(1)
  }
  if (segments.length === 2 && segments[1] === "new") {
    return `New ${segments[0].slice(0, -1)}`
  }
  if (segments.length === 3 && segments[2] === "edit") {
    return `Edit ${segments[0].slice(0, -1)}`
  }

  return segments[segments.length - 1].charAt(0).toUpperCase() + segments[segments.length - 1].slice(1)
}

export function MobileHeader() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const pageTitle = getPageTitle(pathname)

  return (
    <div className="flex items-center justify-between flex-1 ml-4">
      {/* Page Title */}
      <h1 className="text-lg font-semibold truncate">{pageTitle}</h1>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
          <Search className="h-4 w-4" />
          <span className="sr-only">Search</span>
        </Button>

        <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
          <Bell className="h-4 w-4" />
          <span className="sr-only">Notifications</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
              <User className="h-4 w-4" />
              <span className="sr-only">User menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{session?.user?.name || "User"}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {session?.user?.email || "user@example.com"}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => (window.location.href = "/profile")}>Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={() => (window.location.href = "/settings")}>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
