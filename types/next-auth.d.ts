import type { DefaultSession, DefaultUser } from "next-auth"
import type { DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      firstName: string
      lastName: string
      role: string
      employeeId?: string
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    id: string
    email: string
    name: string
    firstName: string
    lastName: string
    role: string
    employeeId?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string
    role: string
    firstName: string
    lastName: string
    employeeId?: string
  }
}
