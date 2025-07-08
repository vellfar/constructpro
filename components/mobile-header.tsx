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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
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
    <div className="flex items-center justify-between w-full px-2 py-2 border-b bg-background">
      {/* Hamburger for mobile nav */}
      <SheetMenu />
      {/* Page Title */}
      <h1 className="text-lg font-semibold truncate flex-1 text-center">{pageTitle}</h1>
      {/* User menu as Sheet for mobile */}
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
            <Button variant="ghost" className="justify-start w-full rounded-none" onClick={() => (window.location.href = "/profile")}>Profile</Button>
            <Button variant="ghost" className="justify-start w-full rounded-none" onClick={() => (window.location.href = "/settings")}>Settings</Button>
            <div className="border-t my-2" />
            <Button variant="ghost" className="justify-start w-full rounded-none text-red-600" onClick={() => signOut()}>Sign out</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )

}

// import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import Link from "next/link"

function SheetMenu() {
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
          <Link href="/" className="py-2 px-3 rounded hover:bg-muted transition-colors">Dashboard</Link>
          <Link href="/projects" className="py-2 px-3 rounded hover:bg-muted transition-colors">Projects</Link>
          <Link href="/activities" className="py-2 px-3 rounded hover:bg-muted transition-colors">Activities</Link>
          <Link href="/equipment" className="py-2 px-3 rounded hover:bg-muted transition-colors">Equipment</Link>
          <Link href="/fuel-management" className="py-2 px-3 rounded hover:bg-muted transition-colors">Fuel Management</Link>
          <Link href="/clients" className="py-2 px-3 rounded hover:bg-muted transition-colors">Clients</Link>
          <Link href="/invoices" className="py-2 px-3 rounded hover:bg-muted transition-colors">Invoices</Link>
          <Link href="/reports" className="py-2 px-3 rounded hover:bg-muted transition-colors">Reports</Link>
          <Link href="/users" className="py-2 px-3 rounded hover:bg-muted transition-colors">Users</Link>
          <Link href="/settings" className="py-2 px-3 rounded hover:bg-muted transition-colors">Settings</Link>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
