import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Download, Trash2 } from "lucide-react"
import Link from "next/link"
import { deleteInvoice } from "@/app/actions/invoice-actions"

interface InvoicePageProps {
  params: {
    id: string
  }
}

export default async function InvoicePage({ params }: InvoicePageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/login")
  }

  const invoiceId = Number.parseInt(params.id)
  if (isNaN(invoiceId)) {
    notFound()
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      project: {
        include: {
          client: true,
        },
      },
    },
  })

  if (!invoice) {
    notFound()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      case "APPROVED":
        return "bg-blue-100 text-blue-800"
      case "PAID":
        return "bg-green-100 text-green-800"
      case "REJECTED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
        <Link href="/invoices">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoices
          </Button>
        </Link>
        <div className="flex items-center gap-2 font-semibold">Invoice Details</div>
        <div className="ml-auto flex items-center gap-4">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/invoices/${invoice.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <form action={deleteInvoice.bind(null, invoice.id)}>
            <Button variant="destructive" size="sm" type="submit">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </form>
        </div>
      </header>

      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Invoice Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Invoice {invoice.invoiceNumber}</CardTitle>
                  <CardDescription>Created on {new Date(invoice.createdAt).toLocaleDateString()}</CardDescription>
                </div>
                <Badge className={getStatusColor(invoice.status)}>{invoice.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="font-semibold mb-2">Project Information</h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Project:</strong> {invoice.project.name}
                    </p>
                    <p>
                      <strong>Project Code:</strong> {invoice.project.projectCode}
                    </p>
                    <p>
                      <strong>Client:</strong> {invoice.project.client?.name || "No client"}
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Invoice Details</h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Service Provider:</strong> {invoice.serviceProvider}
                    </p>
                    <p>
                      <strong>Provider ID:</strong> {invoice.providerId || "N/A"}
                    </p>
                    <p>
                      <strong>Contract Number:</strong> {invoice.contractNumber || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Amount */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Invoice Amount</p>
                  <p className="text-2xl font-bold">UGX {invoice.amount.toLocaleString()}</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Invoice Date</p>
                  <p className="text-lg font-semibold">{new Date(invoice.invoiceDate).toLocaleDateString()}</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Date Received</p>
                  <p className="text-lg font-semibold">{new Date(invoice.dateReceived).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          {invoice.procurementDescription && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{invoice.procurementDescription}</p>
              </CardContent>
            </Card>
          )}

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Document ID</p>
                  <p className="font-medium">{invoice.documentId || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Goods Received Note</p>
                  <p className="font-medium">{invoice.goodsReceivedNote || "Not specified"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
