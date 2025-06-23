"use client"

import type React from "react"

import { SessionProvider } from "next-auth/react"
import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"

interface AuthProviderProps {
  children: React.ReactNode
}

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/unauthorized",
]

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Don't redirect while loading
    if (status === "loading") return

    // Allow access to public routes
    if (PUBLIC_ROUTES.includes(pathname)) return

    // Redirect to login if not authenticated
    if (status === "unauthenticated" || !session) {
      const callbackUrl = encodeURIComponent(pathname)
      router.push(`/auth/login?callbackUrl=${callbackUrl}`)
      return
    }
  }, [session, status, router, pathname])

  // Show loading spinner while checking authentication
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Show login page for unauthenticated users on protected routes
  if (!PUBLIC_ROUTES.includes(pathname) && (status === "unauthenticated" || !session)) {
    return null // Will redirect via useEffect
  }

  return <>{children}</>
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider>
      <AuthGuard>{children}</AuthGuard>
    </SessionProvider>
  )
}
