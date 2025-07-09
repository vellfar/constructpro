"use client"

import type React from "react"

import { SessionProvider } from "next-auth/react"
import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"

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
  const [networkError, setNetworkError] = useState<string | null>(null)

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

  // Global network/session error handler
  useEffect(() => {
    const handleError = (event: any) => {
      if (event?.reason?.message?.includes("Failed to fetch")) {
        setNetworkError("Network connection lost. Please check your internet connection.")
      }
    }
    window.addEventListener("unhandledrejection", handleError)
    return () => window.removeEventListener("unhandledrejection", handleError)
  }, [])

  if (networkError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-red-50">
        <div className="text-red-600 font-bold text-lg mb-2">{networkError}</div>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    )
  }

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
