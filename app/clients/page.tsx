"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Building2,
  Plus,
  Search,
  Phone,
  Mail,
  Loader2,
  Download,
  MapPin,
  User,
  MoreVertical,
  RefreshCw,
} from "lucide-react"
import Link from "next/link"
import { getClients } from "@/app/actions/client-actions"
import { ClientActions } from "@/components/client-actions"
import { exportToCSV, exportToExcel, formatDataForExport } from "@/lib/export-utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

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
  // Pagination state
  const [page, setPage] = useState(1)
  const pageSize = 12
  function getPaginated(list: Client[]) {
    return list.slice((page - 1) * pageSize, page * pageSize)
  }
  function getTotalPages(list: Client[]) {
    return Math.max(1, Math.ceil(list.length / pageSize))
  }
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [refreshing, setRefreshing] = useState(false)

  const fetchClients = async () => {
    try {
      setRefreshing(true)
      const result = await getClients()
      if (result.success && result.data) {
        const clientsData = result.data.map((client: any) => ({
          ...client,
          projects: Array.isArray(client.projects)
            ? client.projects
            : client._count?.projects !== undefined
              ? new Array(client._count.projects).fill(null)
              : [],
        }))
        setClients(clientsData)
        setFilteredClients(clientsData)
      } else {
        setError(result.error || "Failed to load clients")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  // Filter clients based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredClients(clients)
    } else {
      const filtered = clients.filter(
        (client) =>
          client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.address?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredClients(filtered)
    }
  }, [searchTerm, clients])

  const handleExportCSV = () => {
    const exportData = formatDataForExport(filteredClients, "clients")
    exportToCSV(exportData, `clients-${new Date().toISOString().split("T")[0]}`)
  }

  const handleExportExcel = () => {
    const exportData = formatDataForExport(filteredClients, "clients")
    exportToExcel(exportData, `clients-${new Date().toISOString().split("T")[0]}`, "Clients")
  }

  // Mobile Client Card Component
  function ClientCard({ client }: { client: Client }) {
    return (
      <Card className="w-full bg-white border border-gray-200 hover:shadow-md transition-all duration-200">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-gray-900 mb-1">{client.name}</h3>
              {client.contactName && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <User className="h-4 w-4" />
                  <span>{client.contactName}</span>
                </div>
              )}
            </div>
            <ClientActions client={{ ...client, projects: client.projects ?? undefined }} />
          </div>

          <div className="space-y-2">
            {client.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-blue-600" />
                <a href={`mailto:${client.email}`} className="text-blue-600 hover:underline">
                  {client.email}
                </a>
              </div>
            )}

            {client.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-green-600" />
                <a href={`tel:${client.phone}`} className="text-green-600 hover:underline">
                  {client.phone}
                </a>
              </div>
            )}

            {client.address && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-600 line-clamp-2">{client.address}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
              {client.projects?.length || 0} projects
            </Badge>
            <Link href={`/clients/${client.id}`}>
              <Button variant="outline" size="sm">
                View Details
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        {/* Mobile Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-semibold text-gray-900">Clients</h1>
          </div>
        </div>

        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading clients...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        {/* Mobile Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-semibold text-gray-900">Clients</h1>
          </div>
        </div>

        <div className="p-4">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                <p className="text-red-700 font-medium">Error: {error}</p>
              </div>
              <Button onClick={fetchClients} variant="outline" size="sm" className="mt-3 bg-transparent">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6 text-blue-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Clients</h1>
                <p className="text-sm text-gray-600">{filteredClients.length} total</p>
              </div>
            </div>

            {/* Mobile Actions Menu */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchClients} disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExportCSV}>
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportExcel}>
                    <Download className="mr-2 h-4 w-4" />
                    Export Excel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button size="sm" asChild>
                <Link href="/clients/new">
                  <Plus className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 bg-gray-50 border-gray-200"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {filteredClients.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm ? "No clients found" : "No clients yet"}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? "Try adjusting your search terms" : "Get started by adding your first client"}
            </p>
            {!searchTerm && (
              <Button asChild>
                <Link href="/clients/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Client
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile View - Cards */}
            <div className="block md:hidden space-y-4">
              {getPaginated(filteredClients).map((client) => (
                <ClientCard key={client.id} client={client} />
              ))}
            </div>

            {/* Desktop View - Table */}
            <div className="hidden md:block">
              <Card className="bg-white border border-gray-200">
                <CardHeader className="border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-gray-900">Client Directory</CardTitle>
                      <CardDescription className="text-gray-600">
                        Manage your clients and their contact information ({filteredClients.length} clients)
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={handleExportCSV}>
                        <Download className="mr-2 h-4 w-4" />
                        CSV
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleExportExcel}>
                        <Download className="mr-2 h-4 w-4" />
                        Excel
                      </Button>
                      <Button size="sm" asChild>
                        <Link href="/clients/new">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Client
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-100">
                        <TableHead className="text-gray-700">Client Name</TableHead>
                        <TableHead className="text-gray-700">Contact Person</TableHead>
                        <TableHead className="text-gray-700">Contact Info</TableHead>
                        <TableHead className="text-gray-700">Address</TableHead>
                        <TableHead className="text-gray-700">Projects</TableHead>
                        <TableHead className="text-right text-gray-700">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getPaginated(filteredClients).map((client) => (
                        <TableRow key={client.id} className="hover:bg-gray-50 transition-colors border-gray-100">
                          <TableCell>
                            <div className="font-medium text-gray-900">{client.name}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {client.contactName ? (
                                <>
                                  <User className="h-4 w-4 text-gray-400" />
                                  <span className="text-gray-700">{client.contactName}</span>
                                </>
                              ) : (
                                <span className="text-gray-400">N/A</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {client.email && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Mail className="h-3 w-3 text-blue-600" />
                                  <a href={`mailto:${client.email}`} className="text-blue-600 hover:underline">
                                    {client.email}
                                  </a>
                                </div>
                              )}
                              {client.phone && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Phone className="h-3 w-3 text-green-600" />
                                  <a href={`tel:${client.phone}`} className="text-green-600 hover:underline">
                                    {client.phone}
                                  </a>
                                </div>
                              )}
                              {!client.email && !client.phone && (
                                <span className="text-gray-400 text-sm">No contact info</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-600 max-w-xs">
                              {client.address ? (
                                <div className="flex items-start gap-2">
                                  <MapPin className="h-3 w-3 text-gray-400 mt-0.5 flex-shrink-0" />
                                  <span className="truncate">{client.address}</span>
                                </div>
                              ) : (
                                <span className="text-gray-400">No address</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                              {client.projects?.length || 0} projects
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <ClientActions client={{ ...client, projects: client.projects ?? undefined }} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
            {/* Pagination Controls */}
            {getTotalPages(filteredClients) > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                  Prev
                </Button>
                <span className="text-sm text-gray-700">
                  Page {page} of {getTotalPages(filteredClients)}
                </span>
                <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.min(getTotalPages(filteredClients), p + 1))} disabled={page === getTotalPages(filteredClients)}>
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
