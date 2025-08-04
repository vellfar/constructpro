import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Public routes that don't require authentication
    const publicRoutes = [
      "/auth/login",
      //"/auth/register",
      "/auth/forgot-password",
      "/auth/reset-password",
      "/unauthorized",
    ]

    // Allow access to public routes
    if (publicRoutes.includes(pathname)) {
      return NextResponse.next()
    }

    // Redirect to login if no token
    if (!token) {
      const url = new URL("/auth/login", req.url)
      url.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(url)
    }

    // Admin-only routes
    const adminOnlyRoutes = ["/users", "/settings"]

    // Manager+ routes (Admin, Project Manager, Store Manager)
    const managerRoutes = ["/analytics", "/reports"]

    const userRole = token.role as string

    // Check admin-only routes
    if (adminOnlyRoutes.some((route) => pathname.startsWith(route))) {
      if (userRole !== "Admin") {
        return NextResponse.redirect(new URL("/unauthorized", req.url))
      }
    }

    // Check manager routes
    if (managerRoutes.some((route) => pathname.startsWith(route))) {
      if (!["Admin", "Project Manager", "Store Manager"].includes(userRole)) {
        return NextResponse.redirect(new URL("/unauthorized", req.url))
      }
    }

    // FUEL MANAGEMENT - Allow all authenticated users
    // No restrictions on /fuel-management routes

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Public routes are always authorized
        const publicRoutes = [
          "/auth/login",
          "/auth/register",
          "/auth/forgot-password",
          "/auth/reset-password",
          "/unauthorized",
        ]

        if (publicRoutes.includes(pathname)) {
          return true
        }

        // All other routes require authentication
        return !!token
      },
    },
  },
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth.js routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)",
  ],
}
