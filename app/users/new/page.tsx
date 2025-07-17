import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createUser } from "@/app/actions/user-actions"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function NewUserPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/login")
  }

  if (session.user.role !== "Admin") {
    redirect("/unauthorized")
  }

  // Fetch roles for dropdown
  const roles: { id: number; name: string }[] = await prisma.role.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  })

  // Use the updated NewUserForm component for user creation
  // Keep the header for navigation context
  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
        <Link href="/users">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Button>
        </Link>
        <div className="flex items-center gap-2 font-semibold">Add New User</div>
      </header>
      <div className="p-6">
        <NewUserForm roles={roles} />
      </div>
    </div>
  )
}
// Import the client component
import NewUserForm from "./NewUserForm"
