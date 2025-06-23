"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Building2, Plus, Search, Phone, Mail, Loader2 } from "lucide-react"
import Link from "next/link"
import { getClients } from "@/app/actions/client-actions"
import { ClientActions } from "@/components/client-actions"

interface Client {
  id: number
  name: string
  contactName: string | null
  email: string | null
  phone: string | null
  address: string | null
  projects: any[] | null
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const result = await getClients()
        if (result.success && result.data) {
          setClients(result.data)
        } else {
          setError(result.error || "Failed to load clients")
        }
      } catch (err) {
        setError("An unexpected error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchClients()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col">
        <header className="dashboard-header">
          <div className="flex items-center gap-2 font-semibold">
            <Building2 className="h-5 w-5" />
            Clients
          </div>
        </header>
        <div className="loading-spinner">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading clients...</p>
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
            <Building2 className="h-5 w-5" />
            Clients
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
          <Building2 className="h-5 w-5" />
          Clients
        </div>
        <div className="ml-auto flex items-center gap-4">
          <Button size="sm" asChild>
            <Link href="/clients/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Link>
          </Button>
        </div>
      </header>

      <div className="p-6">
        <div className="flex flex-col gap-6 animate-fade-in">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Search clients..." className="w-full bg-background pl-8" />
            </div>
          </div>

          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle>Client Directory</CardTitle>
              <CardDescription>
                Manage your clients and their contact information ({clients.length} clients)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Contact Info</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Projects</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients && clients.length > 0 ? (
                    clients.map((client) => (
                      <TableRow key={client.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell>
                          <div className="font-medium text-foreground">{client.name}</div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{client.contactName || "N/A"}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {client.email && (
                              <div className="flex items-center gap-1 text-sm">
                                <Mail className="h-3 w-3 text-primary" />
                                <span className="text-primary hover:underline cursor-pointer">{client.email}</span>
                              </div>
                            )}
                            {client.phone && (
                              <div className="flex items-center gap-1 text-sm">
                                <Phone className="h-3 w-3 text-primary" />
                                <span className="text-primary hover:underline cursor-pointer">{client.phone}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground max-w-xs truncate">
                            {client.address || "N/A"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-primary/10 text-primary">
                            {client.projects?.length || 0} projects
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <ClientActions client={client} />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="empty-state">
                          <Building2 className="h-12 w-12 text-muted-foreground" />
                          <p className="text-muted-foreground">No clients found</p>
                          <Button asChild className="mt-4">
                            <Link href="/clients/new">Add First Client</Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
