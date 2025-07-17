import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required")
        }

        try {
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
            },
            include: {
              role: true,
              employee: true,
            },
          })

          if (!user) {
            throw new Error("No user found with this email")
          }

          if (!user.isActive) {
            throw new Error("Account is deactivated")
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

          if (!isPasswordValid) {
            throw new Error("Invalid password")
          }

          return {
            id: user.id.toString(),
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role.name,
            employeeId: user.employeeId?.toString(),
            isActive: user.isActive,
          }
        } catch (error) {
          console.error("Authentication error:", error)
          throw error
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        // Defensive: ensure role is a string
        if (typeof user.role === "string") {
          token.role = user.role;
        } else if (user.role && typeof user.role === "object" && user.role !== null && typeof (user.role as any).name === "string") {
          token.role = (user.role as any).name;
        } else {
          token.role = "USER";
        }
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.employeeId = user.employeeId;
        if ('isActive' in user) {
          token.isActive = user.isActive;
        }
      }

      if (trigger === "update" && session) {
        token = { ...token, ...session }
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = typeof token.role === "string" ? token.role : "USER";
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.employeeId = token.employeeId as string;
        if (typeof token.isActive === "boolean") {
          session.user.isActive = token.isActive;
        }
        if (process.env.NODE_ENV === "development") {
          // eslint-disable-next-line no-console
          console.log("[NextAuth session callback] user role:", session.user.role);
        }
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  events: {
    async signIn({ user }) {
      console.log(`User ${user.email} signed in`)
    },
    async signOut() {
      console.log(`User signed out`)
    },
  },
  debug: process.env.NODE_ENV === "development",
}
