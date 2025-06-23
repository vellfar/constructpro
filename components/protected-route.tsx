"use client"

import type React from "react"
import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: string[]
  fallbackUrl?: string
}

export function ProtectedRoute({ children, requiredRole, fallbackUrl = "/unauthorized" }: ProtectedRouteProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    if (status === "loading") return

    // Not authenticated - redirect to login
    if (!session) {
      const callbackUrl = encodeURIComponent(pathname)
      router.push(`/auth/login?callbackUrl=${callbackUrl}`)
      return
    }

    // Check role requirements
    if (requiredRole && requiredRole.length > 0) {
      const userRole = session.user?.role
      if (!userRole || !requiredRole.includes(userRole)) {
        router.push(fallbackUrl)
        return
      }
    }

    setIsAuthorized(true)
  }, [session, status, router, pathname, requiredRole, fallbackUrl])

  // Loading state
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Not authenticated
  if (!session) {
    return null
  }

  // Not authorized (wrong role)
  if (!isAuthorized) {
    return null
  }

  return <>{children}</>
}
