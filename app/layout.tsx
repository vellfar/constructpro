import React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { AuthProvider } from "@/components/auth-provider"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ResponsiveLayout } from "@/components/responsive-layout"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Construct Master - Construction Management System",
  description: "Professional construction project management system",
  keywords: ["construction", "project management", "equipment", "fuel management"],
  authors: [{ name: "Construct Master Team" }],
  viewport: "width=device-width, initial-scale=1",
    generator: 'v0.dev'
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider session={session}>
            <ResponsiveLayout>{children}</ResponsiveLayout>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
