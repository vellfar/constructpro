import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { updateInvoice } from "@/app/actions/invoice-actions"

export const dynamic = "force-dynamic"
export const revalidate = 0

interface EditInvoicePageProps {
  params: {
    id: string
  }
}

export default async function EditInvoicePage({ params }: EditInvoicePageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/login")
  }

  const invoiceId = Number.parseInt(params.id)
  if (isNaN(invoiceId)) {
    notFound()
  }

  const [invoice, projects] = await Promise.all([
    prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        project: {
          include: {
            client: true,
          },
        },
      },
    }),
    prisma.project.findMany({
      include: {
        client: true,
      },
      orderBy: { name: "asc" },
    }),
  ])

  if (!invoice) {
    notFound()
  }

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
        <Link href={`/invoices/${invoice.id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoice
          </Button>
        </Link>
        <div className="flex items-center gap-2 font-semibold">Edit Invoice</div>
      </header>

      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Edit Invoice {invoice.invoiceNumber}</CardTitle>
              <CardDescription>Update invoice information</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={updateInvoice.bind(null, invoice.id)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="invoiceNumber">Invoice Number</Label>
                    <Input id="invoiceNumber" name="invoiceNumber" defaultValue={invoice.invoiceNumber} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serviceProvider">Service Provider</Label>
                    <Input
                      id="serviceProvider"
                      name="serviceProvider"
                      defaultValue={invoice.serviceProvider}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="projectId">Project</Label>
                  <Select name="projectId" defaultValue={invoice.projectId.toString()} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.name} ({project.projectCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input id="amount" name="amount" type="number" step="0.01" defaultValue={invoice.amount} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select name="status" defaultValue={invoice.status} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="APPROVED">Approved</SelectItem>
                        <SelectItem value="PAID">Paid</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="invoiceDate">Invoice Date</Label>
                    <Input
                      id="invoiceDate"
                      name="invoiceDate"
                      type="date"
                      defaultValue={new Date(invoice.invoiceDate).toISOString().split("T")[0]}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateReceived">Date Received</Label>
                    <Input
                      id="dateReceived"
                      name="dateReceived"
                      type="date"
                      defaultValue={new Date(invoice.dateReceived).toISOString().split("T")[0]}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contractNumber">Contract Number</Label>
                    <Input id="contractNumber" name="contractNumber" defaultValue={invoice.contractNumber || ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="providerId">Provider ID</Label>
                    <Input id="providerId" name="providerId" defaultValue={invoice.providerId || ""} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="procurementDescription">Description</Label>
                  <Textarea
                    id="procurementDescription"
                    name="procurementDescription"
                    defaultValue={invoice.procurementDescription || ""}
                    rows={3}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="submit">Update Invoice</Button>
                  <Button type="button" variant="outline" asChild>
                    <Link href={`/invoices/${invoice.id}`}>Cancel</Link>
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
