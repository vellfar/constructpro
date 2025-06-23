"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Plus, Search, FileText, DollarSign, Clock, CheckCircle, Loader2 } from "lucide-react"
import Link from "next/link"

interface Invoice {
  id: number
  invoiceNumber: string
  amount: number
  invoiceDate: Date
  status: string
  serviceProvider: string
  project: {
    name: string
    projectCode: string
    client: {
      name: string
    } | null
  }
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await fetch("/api/invoices")
        if (!response.ok) {
          throw new Error("Failed to fetch invoices")
        }
        const data = await response.json()
        setInvoices(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unexpected error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchInvoices()
  }, [])

  // Calculate statistics
  const totalInvoices = invoices.length
  const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.amount, 0)
  const pendingInvoices = invoices.filter((invoice) => invoice.status === "PENDING").length
  const paidInvoices = invoices.filter((invoice) => invoice.status === "PAID").length

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

  if (loading) {
    return (
      <div className="flex flex-col">
        <header className="dashboard-header">
          <div className="flex items-center gap-2 font-semibold">
            <FileText className="h-5 w-5" />
            Invoice Management
          </div>
        </header>
        <div className="loading-spinner">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading invoices...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col">
        <header className="dashboard-header">
          <div className="flex items-center gap-2 font-semibold">
            <FileText className="h-5 w-5" />
            Invoice Management
          </div>
        </header>
        <div className="p-6">
          <div className="error-state">
            <p className="text-destructive font-medium">Error: {error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <header className="dashboard-header">
        <div className="flex items-center gap-2 font-semibold">
          <FileText className="h-5 w-5" />
          Invoice Management
        </div>
        <div className="ml-auto flex items-center gap-4">
          <div className="relative hidden sm:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search invoices..." className="w-[300px] pl-8" />
          </div>
          <Button asChild>
            <Link href="/invoices/new">
              <Plus className="mr-2 h-4 w-4" />
              New Invoice
            </Link>
          </Button>
        </div>
      </header>

      <div className="p-6 space-y-6 animate-fade-in">
        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="stat-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
              <FileText className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{totalInvoices}</div>
              <p className="text-xs text-muted-foreground">All time invoices</p>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">${totalAmount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total invoice value</p>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{pendingInvoices}</div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{paidInvoices}</div>
              <p className="text-xs text-muted-foreground">Completed payments</p>
            </CardContent>
          </Card>
        </div>

        {/* Invoices Table */}
        <Card className="card-enhanced">
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
            <CardDescription>Manage and track all project invoices ({invoices.length} invoices)</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Service Provider</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="empty-state">
                        <FileText className="h-12 w-12 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          No invoices found. Create your first invoice to get started.
                        </p>
                        <Button asChild className="mt-4">
                          <Link href="/invoices/new">Create First Invoice</Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice) => (
                    <TableRow key={invoice.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{invoice.project.name}</div>
                          <div className="text-sm text-muted-foreground">{invoice.project.projectCode}</div>
                        </div>
                      </TableCell>
                      <TableCell>{invoice.project.client?.name || "No client"}</TableCell>
                      <TableCell>{invoice.serviceProvider}</TableCell>
                      <TableCell className="font-medium text-primary">${invoice.amount.toLocaleString()}</TableCell>
                      <TableCell>{new Date(invoice.invoiceDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(invoice.status)}>{invoice.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/invoices/${invoice.id}`}>View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
