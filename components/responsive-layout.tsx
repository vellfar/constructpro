"use client"

import type * as React from "react"
import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { MobileNav } from "@/components/mobile-nav"

interface ResponsiveLayoutProps {
  children: React.ReactNode
}

export function ResponsiveLayout({ children }: ResponsiveLayoutProps) {
  const { status } = useSession()
  const pathname = usePathname()

  // Check if we're on an auth page
  const isAuthPage = pathname?.startsWith("/auth/")

  // Don't render layout components for auth pages
  if (isAuthPage) {
    return <>{children}</>
  }

  // Show loading state
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Show auth pages without layout
  if (status === "unauthenticated") {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Navigation */}
      <div className="md:hidden">
        <MobileNav />
        <main className="p-4 pb-safe">{children}</main>
      </div>

      {/* Desktop Sidebar Layout */}
      <div className="hidden md:flex h-screen">
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="flex-1 overflow-auto">
            <main className="flex-1 p-6">{children}</main>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </div>
  )
}
