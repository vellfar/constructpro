"use client"

import { useSession } from "next-auth/react"
import type { ReactNode } from "react"

type RoleGateProps = {
  children: ReactNode
  allowedRoles: string[]
  fallback?: ReactNode
}

export function RoleGate({ children, allowedRoles, fallback }: RoleGateProps) {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return null
  }

  if (!session?.user) {
    return fallback || null
  }

  // Get user role
  const userRole = session.user.role

  // Show a warning banner if the user doesn't have the required role
  // but still show the content since routes are public
  if (!allowedRoles.includes(userRole)) {
    return (
      <>
        <div className="mb-4 rounded-md bg-yellow-100 p-4 text-yellow-800">
          <p className="font-medium">Note: This content is typically restricted to specific roles.</p>
          <p className="text-sm">You're viewing this content because route protection has been disabled.</p>
        </div>
        {children}
      </>
    )
  }

  return <>{children}</>
}
