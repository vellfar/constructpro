import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import NewUserForm from "./NewUserForm"

export default async function NewUserPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/login")
  }

  if (session.user.role !== "Admin") {
    redirect("/unauthorized")
  }

  // Fetch roles for dropdown
  const roles = await prisma.role.findMany({
    orderBy: { name: "asc" },
  })

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

      <NewUserForm roles={roles} />
    </div>
  )
}
