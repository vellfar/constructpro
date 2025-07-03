"use client"

import { useEffect, useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ShieldX, Home, LogOut } from "lucide-react"
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}
export default function UnauthorizedPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          router.push("/")
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  const handleGoHome = () => {
    router.push("/")
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/auth/login" })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <ShieldX className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Access Denied</CardTitle>
          <CardDescription>You don't have permission to access this page</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {session && (
            <Alert>
              <AlertDescription>
                Signed in as: <strong>{session.user.email}</strong>
                <br />
                Role: <strong>{session.user.role}</strong>
              </AlertDescription>
            </Alert>
          )}

          <Alert>
            <AlertDescription>You will be redirected to the home page in {countdown} seconds.</AlertDescription>
          </Alert>

          <div className="flex flex-col space-y-2">
            <Button onClick={handleGoHome} className="w-full">
              <Home className="mr-2 h-4 w-4" />
              Go to Home Page
            </Button>

            <Button variant="outline" onClick={handleSignOut} className="w-full">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
