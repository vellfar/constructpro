import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { updateClient } from "@/app/actions/client-actions"

export default async function EditClientPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/login")
  }

  const clientId = Number(params.id)
  if (Number.isNaN(clientId)) {
    notFound()
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
  })

  if (!client) {
    notFound()
  }

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
        <Link href={`/clients/${client.id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Client
          </Button>
        </Link>
        <div className="flex items-center gap-2 font-semibold">
          Edit Client
        </div>
      </header>

      <div className="p-6">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Edit Client</CardTitle>
            <CardDescription>Update client information</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={async (formData) => {
              "use server"
              const result = await updateClient(client.id, formData)
              if (result.success && result.redirectTo) {
                redirect(result.redirectTo)
              }
            }} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Client Name *</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={client.name}
                  required
                  placeholder="Ministry of Infrastructure"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactName">Contact Person</Label>
                <Input
                  id="contactName"
                  name="contactName"
                  defaultValue={client.contactName || ""}
                  placeholder="John Smith"
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={client.email || ""}
                    placeholder="contact@client.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    defaultValue={client.phone || ""}
                    placeholder="+256 701 234567"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  name="address"
                  defaultValue={client.address || ""}
                  placeholder="123 Main Street, Kampala, Uganda"
                  rows={3}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit">Update Client</Button>
                <Button type="button" variant="outline" asChild>
                  <Link href={`/clients/${client.id}`}>Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
