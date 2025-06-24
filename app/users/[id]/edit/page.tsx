import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { updateUser } from "@/app/actions/user-actions"

export const dynamic = "force-dynamic"
export const revalidate = 0

interface EditUserPageProps {
  params: {
    id: string
  }
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/login")
  }

  if (session.user.role !== "Admin") {
    redirect("/unauthorized")
  }

  const userId = Number.parseInt(params.id)
  if (isNaN(userId)) {
    notFound()
  }

  const [user, roles] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        employee: true,
      },
    }),
    prisma.role.findMany({
      orderBy: { name: "asc" },
    }),
  ])

  if (!user) {
    notFound()
  }

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
        <Link href={`/users/${user.id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to User
          </Button>
        </Link>
        <div className="flex items-center gap-2 font-semibold">Edit User</div>
      </header>

      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>
                Edit User: {user.firstName} {user.lastName}
              </CardTitle>
              <CardDescription>Update user information and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={updateUser.bind(null, user.id)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" name="firstName" defaultValue={user.firstName} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" name="lastName" defaultValue={user.lastName} required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" defaultValue={user.email} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input id="phoneNumber" name="phoneNumber" type="tel" defaultValue={user.phoneNumber || ""} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="roleId">Role</Label>
                  <Select name="roleId" defaultValue={user.roleId.toString()} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id.toString()}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox id="isActive" name="isActive" defaultChecked={user.isActive} />
                  <Label htmlFor="isActive">Active User</Label>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="submit">Update User</Button>
                  <Button type="button" variant="outline" asChild>
                    <Link href={`/users/${user.id}`}>Cancel</Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
